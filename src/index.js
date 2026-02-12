import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './frontend/App';
import 'bootstrap/dist/css/bootstrap.min.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
const clientId = '346177034564-1s3c5etv0ginsphpcv4km6rlc6nht54j.apps.googleusercontent.com';
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
<GoogleOAuthProvider clientId={clientId}>
  <App />
</GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
