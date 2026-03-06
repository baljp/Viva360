type PingResponse = { status: (code: number) => { json: (body: unknown) => void } };
export default function handler(_req: unknown, res: PingResponse) {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
}
