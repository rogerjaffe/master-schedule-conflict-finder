import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App';

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
