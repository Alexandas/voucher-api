import axios from "axios";
import { Vouchers } from "../models";
import { HttpError, HttpStatusCode } from "../utils/httperror";
import { Op } from "sequelize";

interface UserRes {
	code: number,
	message: string
	data: {
		wallet: {
			address?: string
			walletType: string
		}
	}
}

export default class Service {

	static async checkOauth(token: string) {
		try {
			const uri = process.env.OAUTHURL ?? 'https://auth.foreverland.xyz/user'
			return await axios.get<UserRes>(uri, {
				headers: {
					'authorization': `Bearer ${token}`
				}
			})
		} catch (e) {
			throw new HttpError(HttpStatusCode.InternalError, "auth failed")
		}
	}

	static async getAddress(token: string) {
		try {
			const res = await this.checkOauth(token)
			const address = res.data.data.wallet.address
			if (!address) {
				throw new HttpError(HttpStatusCode.Forbidden, 'user not found')
			}
			return address
		} catch (e) {
			if (e instanceof HttpError) {
				throw e
			}
			throw new HttpError(HttpStatusCode.BadRequest, 'Bad request')
		}
	}

	static async getVouchers(address: string) {
		const vourchers = await Vouchers.findAll({
			where: {
				address
			}
		})
		return vourchers
	}

	static async getValidVouchers(address: string) {
		const vourchers = await Vouchers.findAll({
			where: {
				[Op.and]: {
					address,
					expiredAt: {
						[Op.gt]: Date.now()
					},
					claimedAt: {
						[Op.is]: null
					}
				},
			}
		})
		return vourchers
	}

	static async getClaimable(address: string) {
		const vouchers = await this.getValidVouchers(address)
		return vouchers;
	}

	static async claim(code: string, address: string, activity: number) {
		await Vouchers.update(
			{
				claimedAt: new Date()
			},
			{
				where: {
					[Op.and]: { code, address, activity }
				}
			}
		)
	}

}