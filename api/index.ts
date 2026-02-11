// import app from '../backend/src/app.micro';
// export default app;

export default function handler(req: any, res: any) {
    res.status(200).json({ status: 'ok', raw: true, time: new Date().toISOString() });
}
