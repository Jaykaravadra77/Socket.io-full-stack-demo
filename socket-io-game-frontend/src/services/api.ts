export const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'An error occurred during login');
  }

  return await response.json();
};

export const startGame = async (token: string) => {
  const response = await fetch('http://localhost:3000/api/game/start-game', {
    method: 'POST',
    headers: {
      // 'Content-Type': 'application/json',
      'Authorization': `${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'An error occurred while starting the game');
  }

  return await response.json();
};