import { GameRound } from "../../app";

export function generateGameRounds(songs: any[], numRounds: number): GameRound[] {
    const rounds: GameRound[] = [];
    const availableSongs = [...songs];

    for (let i = 0; i < numRounds; i++) {
        // Ensure we have enough songs
        if (availableSongs.length < 4) {
            // Reset available songs if we're running low
            availableSongs.push(...songs);
        }

        // Shuffle and pick 4 songs for options
        const shuffled = [...availableSongs].sort(() => 0.5 - Math.random());
        const roundSongs = shuffled.slice(0, 4);
        console.log("Round Songs: ", roundSongs);

        // Pick one as the correct answer
        const correctSong = roundSongs[Math.floor(Math.random() * roundSongs.length)];

        // Remove used songs to avoid repetition
        roundSongs.forEach(song => {
            const index = availableSongs.findIndex(s => s._id === song._id);
            if (index > -1) availableSongs.splice(index, 1);
        });

        rounds.push({
            roundNumber: i + 1,
            correctSong: {
                song_name: correctSong.song_name,
                url: correctSong.url
            },
            options: roundSongs.map(song => song.song_name)
        });
    }

    return rounds;
}