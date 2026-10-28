import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { studyMode } from './lib/studyRuntime';
import { StudyFlow } from './components/Study/StudyFlow';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {studyMode ? <StudyFlow /> : <App />}
  </React.StrictMode>,
);
