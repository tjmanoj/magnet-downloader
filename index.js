import WebTorrent from 'webtorrent';
import express from 'express';
import cors from 'cors';

const app = express();
const client = new WebTorrent();

app.use(cors()); // Allow cross-origin requests

app.get('/download', (req, res, next) => {
    try {
        const magnetURI = req.query.magnet;

        if (!magnetURI) {
            return res.status(400).send("Magnet link is required!");
        }

        console.log("Downloading:", magnetURI);

        client.add(magnetURI, (torrent) => {
            if (!torrent) {
                return res.status(500).send("Failed to add torrent!");
            }

            console.log("Torrent metadata fetched:", torrent.name);

            const file = torrent.files.find(f => 
                f.name.endsWith('.mp4') || 
                f.name.endsWith('.zip') || 
                f.name.endsWith('.pdf') || 
                f.name.endsWith('.exe') || 
                f.name.endsWith('.mkv')
            );

            if (!file) {
                return res.status(404).send("No valid file found in torrent!");
            }

            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
            res.setHeader('Content-Type', 'application/octet-stream');

            const stream = file.createReadStream();

            // Handle errors during streaming
            stream.on('error', (err) => {
                console.error("Stream error:", err);
                return res.status(500).send("Error while streaming file!");
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
        }).on('error', (err) => {
            console.error("Error adding torrent:", err);
            return res.status(500).send("Invalid or broken magnet link!");
        });

    } catch (error) {
        next(error);
    }
});

// Global error-handling middleware
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).send("Internal Server Error!");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
