const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Server-side array to keep track of wishes safely in memory
const wishDatabase = [];

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Way to make your wish true</title>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { 
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; 
                    min-height: 100vh; 
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%); 
                    color: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    padding: 40px 20px;
                }
                
                /* Top Right Corner Button */
                .admin-trigger-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.07);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #c7d2fe;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                    z-index: 10;
                }
                .admin-trigger-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: #fff;
                }

                .container {
                    width: 100%;
                    max-width: 500px;
                    text-align: center;
                    margin-top: 40px;
                }

                /* Heading/Title */
                h1 { 
                    font-size: 32px; 
                    font-weight: 800;
                    margin-bottom: 40px; 
                    color: #ffffff; 
                    text-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
                    letter-spacing: -0.5px;
                }

                .form-group {
                    margin-bottom: 40px;
                    text-align: center;
                }

                label {
                    display: block;
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: #e2e8f0;
                    letter-spacing: 0.5px;
                }

                /* Input boxes in the center */
                .input-box { 
                    width: 100%; 
                    max-width: 400px;
                    padding: 14px; 
                    background: rgba(255, 255, 255, 0.05);
                    border: 1.5px solid rgba(255, 255, 255, 0.15); 
                    border-radius: 12px; 
                    font-size: 16px; 
                    color: white;
                    text-align: center;
                    transition: all 0.3s;
                    backdrop-filter: blur(4px);
                    outline: none;
                }
                .input-box:focus { 
                    border-color: #a855f7; 
                    background: rgba(255, 255, 255, 0.1);
                    box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
                }

                textarea.input-box {
                    height: 110px;
                    resize: none;
                }

                /* Steps List Container underneath */
                .list-container {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 25px 20px;
                    margin: 35px auto;
                    width: 100%;
                    max-width: 400px;
                    text-align: left;
                }

                .list-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #c084fc;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                ol { padding-left: 20px; margin: 0; }
                li { margin-bottom: 12px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
                .example-note { display: block; margin-top: 4px; color: #94a3b8; font-style: italic; font-size: 13px; }

                /* Bottom Center Submit Area */
                .bottom-section {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    margin-top: 20px;
                }

                .btn-submit { 
                    padding: 15px 50px; 
                    background: linear-gradient(90deg, #a855f7, #6366f1);
                    color: white; 
                    border: none; 
                    border-radius: 25px; 
                    font-size: 16px; 
                    font-weight: 700; 
                    cursor: pointer; 
                    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
                    transition: all 0.3s;
                }
                .btn-submit:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
                }

                /* Overlay Verification Box Panel */
                .modal-overlay {
                    display: none;
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(4, 6, 14, 0.9);
                    backdrop-filter: blur(8px);
                    z-index: 100;
                    justify-content: center;
                    align-items: center;
                }

                .modal-card {
                    background: #111424;
                    border: 1px solid rgba(168, 85, 247, 0.3);
                    padding: 30px;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 450px;
                    text-align: center;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }

                .modal-card h2 {
                    font-size: 20px;
                    margin-bottom: 20px;
                    color: #c7d2fe;
                }

                /* This is the box where you write the code */
                .secret-box {
                    width: 100%;
                    padding: 14px;
                    background: #070913;
                    border: 1px solid #312e81;
                    color: #a7f3d0;
                    font-family: monospace;
                    font-size: 16px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 20px;
                    outline: none;
                }

                .modal-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .btn-action {
                    padding: 10px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    border: none;
                    font-weight: 600;
                    font-size: 14px;
                }
                .btn-verify { background: #a855f7; color: white; }
                .btn-close { background: #334155; color: #cbd5e1; }

                /* Master Wish Dashboard Panel view */
                .dashboard-panel {
                    display: none;
                    width: 100%;
                    max-height: 350px;
                    overflow-y: auto;
                    text-align: left;
                    margin-top: 15px;
                    background: #090b14;
                    border-radius: 12px;
                    padding: 15px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .wish-row {
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .wish-row:last-child { border-bottom: none; }
                .viewer-name { font-weight: bold; color: #a855f7; margin-bottom: 4px; }
                .viewer-text { color: #e2e8f0; font-size: 14px; line-height: 1.4; }
            </style>
        </head>
        <body>

            <!-- Wishes Trigger Top Right -->
            <button class="admin-trigger-btn" id="wishes-btn">Wishes</button>

            <div class="container">
                <h1>way to make your wish true</h1>
                
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="name-box" class="input-box" placeholder="Your Name">
                </div>
                
                <div class="form-group">
                    <label>Your wish:</label>
                    <textarea id="wish-box" class="input-box" placeholder="Write your heart's desire..."></textarea>
                </div>

                <div class="list-container">
                    <div class="list-title">steps to make your wish true</div>
                    <ol>
                        <li>Type your name</li>
                        <li>
                            Type ur wish
                            dashboardView.style.display = 'block';exitDashboardBtn.style.display = 'block';// Send request code verification payload to backendws.send(JSON.stringify({ action: 'GET_WISHES', code: '1111' }));} else {alert("🚫 Incorrect Code String Length or Value. Access Denied.");secretModal.style.display = 'none';}});// 4. Live Feedback WebSocket Readerws.onmessage = (event) => {const message = JSON.parse(event.data);if (message.type === 'WISH_DATA_STREAM') {dashboardView.innerHTML = '';if(message.data.length === 0) {dashboardView.innerHTML = 'No wishes inside the database yet.';} else {message.data.forEach(item => {dashboardView.innerHTML += `👤 ${escapeHtml(item.name)}🔮 ${escapeHtml(item.wish)}`;});}}};function escapeHtml(str) {return str.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");}`);});// Websocket operational stream triggerswss.on('connection', (ws) => {ws.on('message', (messageText) => {try {const data = JSON.parse(messageText);if (data.action === 'SUBMIT_WISH') {wishDatabase.push({ name: data.name, wish: data.wish });}else if (data.action === 'GET_WISHES' && data.code === '1111') {ws.send(JSON.stringify({type: 'WISH_DATA_STREAM',data: wishDatabase}));}} catch (e) {console.error("Invalid frame drop");}});});const PORT = process.env.PORT || 3000;server.listen(PORT, () => console.log(Server live on port ${PORT}));
