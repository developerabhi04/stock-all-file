const AGENT_NAMES = [
    'Emily Carter',
    'James Whitfield',
    'Olivia Bennett',
    'Michael Sanders',
    'Sophia Turner',
    'Daniel Brooks',
    'Ava Mitchell',
    'Ethan Parker',
    'Isabella Reed',
    'Noah Sullivan',
    'Ahmed Al Maktoum',
    'Fatima Al Suwaidi',
    'Omar Al Nahyan',
    'Layla Al Farsi',
    'Khalid Al Mansoori',
    'Maryam Al Qasimi',
    'Rashid Al Ketbi',
    'Noura Al Shamsi',
    'Hassan Al Marri',
    'Aisha Al Zaabi',
    'Liam Anderson',
    'Grace Thompson',
    'Benjamin Clarke',
    'Chloe Robinson',
    'William Foster'
];

export const getRandomAgentName = () => {
    const index = Math.floor(Math.random() * AGENT_NAMES.length);
    return AGENT_NAMES[index];
};

export const GREETING_KEYWORDS = ['hi', 'hello', 'hey', 'hii', 'helo', 'hlo'];

export const isGreetingMessage = (text = '') => {
    const normalized = text.trim().toLowerCase();
    return GREETING_KEYWORDS.some(
        (keyword) => normalized === keyword || normalized.startsWith(`${keyword} `)
    );
};