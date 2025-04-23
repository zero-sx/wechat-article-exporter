import {H3Event, parseCookies} from "h3";

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
    event: H3Event
    endpoint: string
    method: Method
    query?: Record<string, string | number | undefined>
    body?: Record<string, string | number | undefined>
    parseJson?: boolean
    withCredentials?: boolean
}

export async function proxyMpRequest(options: RequestOptions) {
    const cookies = parseCookies(options.event)
    const cookie = Object.keys(cookies).map(key => `${key}=${cookies[key]}`).join(';')

    if (options.withCredentials === undefined) {
        options.withCredentials = true;
    }

    const fetchInit: RequestInit = {
        method: options.method,
        headers: {
            Referer: 'https://mp.weixin.qq.com/',
            Origin: 'https://mp.weixin.qq.com',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            Cookie: options.withCredentials ? cookie : '',
        },
    }

    if (options.query) {
        options.endpoint += '?' + new URLSearchParams(options.query as Record<string, string>).toString()
    }
    if (options.method === 'POST' && options.body) {
        fetchInit.body = new URLSearchParams(options.body as Record<string, string>).toString()
    }

    const response = await fetch(options.endpoint, fetchInit)
    console.log(options.endpoint);
    // console.log(fetchInit);
    
    if (!options.parseJson) {
        console.log(response);
        
        // 移除Secure属性
        const headers = new Headers(response.headers)
        const cookies = headers.get('set-cookie')
        if (cookies) {
            const newCookies = cookies.split(',').map(cookie => 
                cookie.split(';').filter(attr => !attr.trim().toLowerCase().startsWith('secure')).join(';')
            ).join(',')
            headers.set('set-cookie', newCookies)
        }
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        })
    } else {
        return response.json()
    }
}

export function formatTraffic(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} Bytes`
    } else if (bytes < 1024 ** 2) {
        return `${(bytes / 1024).toFixed(2)} KB`
    } else if (bytes < 1024 ** 3) {
        return `${(bytes / (1024 ** 2)).toFixed(2)} MB`
    } else if (bytes < 1024 ** 4) {
        return `${(bytes / (1024 ** 3)).toFixed(2)} GB`
    } else if (bytes < 1024 ** 5) {
        return `${(bytes / (1024 ** 4)).toFixed(2)} TB`
    }
}
