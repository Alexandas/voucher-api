import * as Router from 'koa-router';
import service from './service'

const router = new Router();

router.get("/vouchers", async (ctx: any) => {
	const token = ctx.request.token
	const address = await service.getAddress(token)
	const vouchers = await service.getClaimable(address)
	ctx.body = vouchers
});

router.post("/vouchers/claim", async (ctx: any) => {
	const token = ctx.request.token
	const code = ctx.request.body.code
	const activity = ctx.request.body.activity
	const address = await service.getAddress(token)
	await service.claim(code, address, activity)
	ctx.body = { code }
});

export default router;