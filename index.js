import WebTorrent from 'webtorrent';
import express from 'express';
import cors from 'cors';

const app = express();
const client = new WebTorrent();

app.use(cors()); // Allow cross-origin requests

app.get('/download', (req, res) => {
    const magnetURI = req.query.magnet;

    if (!magnetURI) {
        return res.status(400).send("Magnet link is required!");
    }

    console.log("Downloading:", magnetURI);

    client.add(magnetURI, (torrent) => {
        console.log("Torrent metadata fetched:", torrent.name);

        const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.zip') || f.name.endsWith('.pdf') || f.name.endsWith('.exe') || f.name.endsWith('.mkv'));

        if (!file) {
            return res.status(404).send("No valid file found in torrent!");
        }

        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        const stream = file.createReadStream();

        // Handle errors during streaming
        stream.on('error', (err) => {
            console.error("Stream error:", err);
            res.status(500).send("Error while streaming file!");
        });

        stream.on('end', () => {
            console.log("Download complete:", file.name);
            res.end();
        });

        // Handle client disconnection
        res.on('close', () => {
            console.log("Client disconnected, stopping stream...");
            stream.destroy();
        });

        stream.pipe(res);
    });
});

app.listen(3000, () => console.log("Server running on port 8080"));
