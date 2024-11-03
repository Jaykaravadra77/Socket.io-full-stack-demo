import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getSocket, initSocket } from '../../services/socket';
import styles from '../../styles/gamePage.module.css';

interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
}

interface GameState {
  roomId: string;
  gameId: string;
  status: 'waiting' | 'ready' | 'in_progress' | 'completed';
  playersJoined: number;
  maxPlayers: number;
  players: Player[];
  board: string[][];
  currentTurn: string;
  winner?: string;
  isDraw: boolean;
}

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [gameState, setGameState] = useState<GameState | null>(location.state as GameState);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (gameState) {
      localStorage.setItem('currentGame', JSON.stringify({
        gameId: gameState.gameId,
        roomId: gameState.roomId,
        status: gameState.status,
        timestamp: Date.now()
      }));
    }
  }, [gameState]);

  useEffect(() => {
    let socket: any;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token not found');
        navigate('/login');
        return;
      }

      // Initialize socket with token
      initSocket(token);
      socket = getSocket();

      const storedUserId = localStorage.getItem('userId');
      if (!storedUserId) {
        console.error('User ID not found in localStorage');
        navigate('/login');
        return;
      }

      setUserId(storedUserId);

      // Handle reconnection
      const storedGame = localStorage.getItem('currentGame');
      if (storedGame) {
        const gameData = JSON.parse(storedGame);
        const currentTime = Date.now();
        const gameAge = currentTime - gameData.timestamp;
        
        if (gameAge < 3600000) {
          socket.emit('reconnectToGame', {
            gameId: gameData.gameId,
            roomId: gameData.roomId,
            playerId: storedUserId,
            status: gameData.status
          });
        } else {
          localStorage.removeItem('currentGame');
        }
      }

      // Event listeners
      socket.on('reconnectionSuccess', (data: GameState) => {
        setGameState(data);
        if (data.status === 'ready') {
          socket.emit('readyToStart', { gameId: data.gameId });
        }
      });

      socket.on('reconnectionFailed', () => {
        localStorage.removeItem('currentGame');
        navigate('/join');
      });

      socket.on('player_joined', (data: { playerId: string; playerName: string; playersJoined: number }) => {
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            playersJoined: data.playersJoined,
            players: [
              ...prevState.players,
              { id: data.playerId, name: data.playerName, symbol: prevState.players.length === 0 ? 'X' : 'O' }
            ]
          };
        });
      });

      socket.on('countdownStart', (data: { duration: number }) => {
        setCountdown(data.duration);
        setGameState(prevState => prevState ? { ...prevState, status: 'ready' } : null);
      });

      socket.on('countdownUpdate', (data: { timeLeft: number }) => {
        setCountdown(data.timeLeft);
      });
      
      socket.on('gameStart', (data: { gameId: string; players: Player[]; currentTurn: string; board: string[][] }) => {
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            status: 'in_progress',
            players: data.players,
            currentTurn: data.currentTurn,
            board: data.board
          };
        });
        setCountdown(null);
      });
      
      socket.on('gameStateUpdated', (data: { board: string[][]; currentTurn: string; status: 'waiting' | 'ready' | 'in_progress' | 'completed' }) => {
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            board: data.board,
            currentTurn: data.currentTurn,
            status: data.status
          };
        });
      });
      
      socket.on('gameOver', (data: { winner: string; isDraw: boolean }) => {
        setGameState(prevState => {
          if (!prevState) return null;
          return {
            ...prevState,
            status: 'completed',
            winner: data.winner,
            isDraw: data.isDraw
          };
        });
        localStorage.removeItem('currentGame');
      });

      socket.on('ready_to_start', (data: { gameId: string }) => {
        socket.emit('readyToStart', { gameId: data.gameId });
      });

      socket.on('moveError', (data: { message: string }) => {
        setError(data.message);
      });

      return () => {
        if (socket) {
          socket.off('reconnectionSuccess');
          socket.off('reconnectionFailed');
          socket.off('player_joined');
          socket.off('ready_to_start');
          socket.off('countdownStart');
          socket.off('countdownUpdate');
          socket.off('gameStart');
          socket.off('gameStateUpdated');
          socket.off('gameOver');
          socket.off('moveError');
        }
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
      navigate('/login');
    }
  }, [navigate]);

  const handleCellClick = (row: number, col: number) => {
    if (!gameState || gameState.status !== 'in_progress' || gameState.board[row][col] !== '') return;

    const socket = getSocket();
    const loggedInPlayer = gameState.players.find(player => player.id === userId);

    if (loggedInPlayer) {
      socket.emit('playerMove', {
        gameId: gameState.gameId,
        playerId: loggedInPlayer.id,
        move: { row, col }
      });
    } else {
      console.error('Logged-in player not found in the game');
    }
  };

  const renderBoard = () => {
    if (!gameState || !gameState.board) return null;

    return (
      <div className={styles.board}>
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className={styles.row}>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={styles.cell}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell && <span className={styles.cellSymbol}>{cell}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!gameState) {
    return <div className={styles.loading}>Loading game...</div>;
  }

  return (
    <div className={styles.gamePage}>
      <h2>Game Room: {gameState.roomId}</h2>
      <div className={styles.playerInfo}>
        {gameState.players.map((player: Player) => (
          <div key={player.id} className={styles.player}>
            <span>{player.name}</span>
            <span>({player.symbol})</span>
          </div>
        ))}
        {gameState.players.length < 2 && (
          <div className={styles.player}>
            <span>Waiting for player...</span>
          </div>
        )}
      </div>
      <div className={styles.gameStatus}>
        Status: {gameState.status}
        {gameState.status === 'waiting' && <p>Waiting for another player to join...</p>}
        {gameState.status === 'ready' && countdown !== null && (
          <p>Game starting in: {countdown} seconds</p>
        )}
        {gameState.status === 'in_progress' && (
          <p>Current Turn: {gameState.players.find(p => p.id === gameState.currentTurn)?.name}</p>
        )}
        {gameState.status === 'completed' && (
          <p>
            {gameState.isDraw
              ? "It's a draw!"
              : `Winner: ${gameState.players.find(p => p.id === gameState.winner)?.name}`}
          </p>
        )}
      </div>
      <hr className={styles.divider} />
      {renderBoard()}
    </div>
  );
};

export default GamePage;