import React from 'react';
import styles from '../styles/layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
          <header className={styles.header}>
        <h1 className={styles.gameName}>GridLock: Tactical XO</h1>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;