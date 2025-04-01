"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Generates unique compound usernames in the format "adjective-noun"
 * @param options - Configuration options
 * @returns A unique compound username
 */
function generateCompoundUsername() {
    return __awaiter(this, arguments, void 0, function* (options = {}) {
        // Default lists - you can expand these or replace with your own
        const defaultAdjectives = [
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
        const defaultNouns = [
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
        const { adjectives = defaultAdjectives, nouns = defaultNouns, separator = '-', checkExisting = () => __awaiter(this, void 0, void 0, function* () { return false; }), // Default assumes username doesn't exist
        maxAttempts = 10 } = options;
        // Try up to maxAttempts times to generate a unique username
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Select random adjective and noun
            const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            // Form the username
            const username = `${adjective}${separator}${noun}`;
            // Check if username exists
            const exists = yield checkExisting(username);
            if (!exists) {
                return username;
            }
        }
        // If all attempts failed, add a timestamp to ensure uniqueness
        const timestamp = Date.now().toString().slice(-4);
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${adjective}${separator}${noun}${separator}${timestamp}`;
    });
}
exports.default = generateCompoundUsername;
