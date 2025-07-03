import { GameRound } from "../../app";

export function generateGameRounds(songs: any[], numRounds: number): GameRound[] {

    const rounds: GameRound[] = [];
    const possibleStartTimes = [15, 30, 45, 60];

    for (let i = 0; i < numRounds; i++) {
        const randomSong = songs[Math.floor(Math.random() * songs.length)];
        const randomStartTime = possibleStartTimes[Math.floor(Math.random() * possibleStartTimes.length)];
        const wrongOptions = songs
            .filter(song => song.song_name !== randomSong.song_name)
            .slice(0, 3)
            .map(song => song.song_name);

        const allOptions = [randomSong.song_name, ...wrongOptions]
            .sort(() => Math.random() - 0.5);

        rounds.push({
            roundNumber: i + 1,
            correctSong: {
                song_name: randomSong.song_name,
                url: randomSong.url
            },
            options: allOptions,
            startTime: randomStartTime,
            syncTimestamp: Date.now()
        });
    }

    return rounds;

}