import type { RawData, WebSocket } from 'ws'

export type WsClient = WebSocket & { id?: string }

export const safeSend = (ws: WebSocket, data: string | Buffer | ArrayBuffer | RawData) => {
	if (ws.readyState === ws.OPEN) ws.send(data)
}

export const broadcast = (clients: Set<WebSocket>, data: string) => {
	for (const client of clients) safeSend(client, data)
}
