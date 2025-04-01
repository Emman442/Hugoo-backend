/**
 * Options for generating compound usernames
 */
interface CompoundUsernameOptions {
    /** List of adjectives to use */
    adjectives?: string[];
    /** List of nouns to use */
    nouns?: string[];
    /** Character used to separate words */
    separator?: string;
    /** Async function to check if username exists */
    checkExisting?: (username: string) => Promise<boolean>;
    /** Maximum attempts to generate unique username */
    maxAttempts?: number;
}

/**
 * Generates unique compound usernames in the format "adjective-noun"
 * @param options - Configuration options
 * @returns A unique compound username
 */
async function generateCompoundUsername(options: CompoundUsernameOptions = {}): Promise<string> {
    // Default lists - you can expand these or replace with your own
    const defaultAdjectives: string[] = [
        'ancient', 'autumn', 'bold', 'brave', 'bright', 'calm', 'clever', 'cold',
        'cosmic', 'crimson', 'curious', 'dancing', 'daring', 'desert', 'distant',
        'eager', 'electric', 'elegant', 'emerald', 'enchanted', 'endless', 'fierce',
        'flaming', 'flying', 'focused', 'forest', 'frozen', 'gentle', 'glowing',
        'golden', 'graceful', 'happy', 'hidden', 'humble', 'icy', 'infinite',
        'jolly', 'jumping', 'laughing', 'little', 'lively', 'lucky', 'marble',
        'midnight', 'mighty', 'misty', 'mountain', 'mystic', 'noble', 'obsessive',
        'ocean', 'peaceful', 'purple', 'quick', 'quiet', 'rapid', 'ruby', 'rustic',
        'sailing', 'silent', 'silver', 'sleepy', 'smiling', 'snowy', 'solar',
        'speedy', 'spring', 'storm', 'summer', 'swift', 'tropical', 'warped',
        'whispering', 'wild', 'winter', 'wise', 'wondering'
    ];

    const defaultNouns: string[] = [
        'arrow', 'aurora', 'badge', 'banner', 'bard', 'bear', 'bird', 'blossom',
        'breeze', 'brook', 'captain', 'cat', 'cloud', 'comet', 'crow', 'crystal',
        'dawn', 'deer', 'dolphin', 'dragon', 'dream', 'eagle', 'echo', 'elephant',
        'falcon', 'feather', 'fire', 'fish', 'flame', 'flower', 'forest', 'fox',
        'galaxy', 'garden', 'gate', 'glade', 'hawk', 'hill', 'horizon', 'island',
        'journey', 'lake', 'leaf', 'leopard', 'light', 'lion', 'lotus', 'luna',
        'maple', 'meadow', 'meteor', 'moon', 'mountain', 'oak', 'ocean', 'owl',
        'panda', 'path', 'phoenix', 'pilot', 'planet', 'pond', 'rain', 'raven',
        'reef', 'river', 'road', 'rock', 'rose', 'sage', 'sea', 'shadow', 'sky',
        'snow', 'spark', 'star', 'stone', 'storm', 'stream', 'sun', 'swift',
        'tiger', 'tree', 'valley', 'water', 'wave', 'wind', 'wolf', 'wonder', "sorpano"
    ];

    // Merge defaults with provided options
    const {
        adjectives = defaultAdjectives,
        nouns = defaultNouns,
        separator = '-',
        checkExisting = async () => false, // Default assumes username doesn't exist
        maxAttempts = 10
    } = options;

    // Try up to maxAttempts times to generate a unique username
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Select random adjective and noun
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];

        // Form the username
        const username = `${adjective}${separator}${noun}`;

        // Check if username exists
        const exists = await checkExisting(username);
        if (!exists) {
            return username;
        }
    }

    // If all attempts failed, add a timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adjective}${separator}${noun}${separator}${timestamp}`;
}

export default generateCompoundUsername;