const axios = require('axios');

async function fetchOpenGraph(url) {
    try {
        const { data } = await axios.get('https://api.microlink.io', {
            params: { url },
            timeout: 10000,
        });

        if (data.status !== 'success') {
            console.warn('[OpenGraph] microlink no retornó success:', data.status);
            return { title: null, thumbnail: null, description: null };
        }

        const result = {
            title:       data.data?.title       || null,
            thumbnail:   data.data?.image?.url  || data.data?.logo?.url || null,
            description: data.data?.description || null,
        };

        console.log('[OpenGraph]', { url, ...result });
        return result;

    } catch (err) {
        console.warn('[OpenGraph] Error al obtener metadata:', err.message);
        return { title: null, thumbnail: null, description: null };
    }
}

module.exports = fetchOpenGraph;
