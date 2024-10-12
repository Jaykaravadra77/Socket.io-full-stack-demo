import React, { useEffect, useState } from 'react';
import { startGame } from '../../services/api';
import { initSocket } from '../../services/socket';
import styles from '../../styles/JoinGame.module.css';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const JoinGame: React.FC = () => {
  const [gameState, setGameState] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      initSocket(token);
    }
  }, []);

  const handleJoinGame = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const result = await startGame(token);
        setGameState(result);
        toast.success('Successfully joined the game!');
        navigate(`/game/${result.gameId}`, { state: result });
      } else {
        toast.error('No authentication token found. Please login again.');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred while joining the game');
      }
    }
  };

  return (
    <div className={styles.gameCard}>
      <h2 className={styles.title}>Join Game</h2>
      <button onClick={handleJoinGame} className={styles.button}>Join Game</button>
      {gameState && (
        <div className={styles.gameInfo}>
          <p><strong>Room ID:</strong> {gameState.roomId}</p>
          <p><strong>Game ID:</strong> {gameState.gameId}</p>
          <p><strong>Status:</strong> {gameState.status}</p>
          <p><strong>Players Joined:</strong> {gameState.playersJoined}</p>
        </div>
      )}
    </div>
  );
};

export default JoinGame;