import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'ok',
    env: process.env.NEXT_PUBLIC_ENV || 'unknown',
    version: process.env.NEXT_PUBLIC_VERSION || 'unversioned',
  })
}
