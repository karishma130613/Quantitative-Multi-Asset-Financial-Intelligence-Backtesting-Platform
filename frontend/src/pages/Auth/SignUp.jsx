import React from 'react';
import Login from './Login';

export default function SignUp({ onNavigate }) {
  return <Login onNavigate={onNavigate} initialMode="signup" />;
}
