import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import RenderView from './RenderView';

const isRender = new URLSearchParams(location.search).has('render');

createRoot(document.getElementById('root')!).render(isRender ? <RenderView /> : <StrictMode><App /></StrictMode>);
