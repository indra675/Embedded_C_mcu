# CodeShelf
Run locally: `node server.js` then open http://localhost:3000
Deploy on Render: New > Web Service > Build: (empty) > Start: `node server.js`. Add a Disk mounted at /var/data (set DATA_DIR) so logins and progress persist.
Without the server (plain static hosting) the site still works; progress is saved in the browser only.
