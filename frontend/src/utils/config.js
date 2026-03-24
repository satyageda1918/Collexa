export const getBackendUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

export const getWsUrl = (userId = 'guest') => {
    const backendUrl = getBackendUrl();
    const wsProtocol = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
    // Remove protocol and trailing slash
    const host = backendUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${wsProtocol}//${host}/ws/${userId}`;
};
