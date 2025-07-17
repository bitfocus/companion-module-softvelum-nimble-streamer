import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import crypto from 'crypto'


export class ModuleInstance extends InstanceBase<ModuleConfig> {
	dynamicVariables: string[] = []
	variableUpdateEnabled: boolean = false
	config!: ModuleConfig // Setup in init()
	private pollTimer: NodeJS.Timeout | undefined
	republishRulesCache: { id: string; label: string }[] = []
	republishRulesRawIds: Set<string> = new Set()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean): Promise<void> {
		this.config = config
		this.dynamicVariables = []

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		void this.pollStatus() //initial Status Poll

		this.pollTimer = setInterval(() => {
			void this.pollStatus()
		}, 1 * 1000)
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.variableUpdateEnabled = false

		if (this.pollTimer) {
			clearInterval(this.pollTimer)
			this.pollTimer = undefined
		}

		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	async pollStatus(): Promise<void> {
		try {
			this.checkFeedbacks()

			//List Updates
			await this.updateServerStatus()
			this.syncRepublishRules()


		} catch (error) {
			this.log('error', `Polling error: ${error}`)
		}
	}

	async apiGet(apimethod: string): Promise<any> {
		this.log('debug', `Send GET request to ${apimethod}`)
		const url = this.generateRequestUrl(`http://${this.config.server}:${this.config.port}/${apimethod}`)
		this.log('debug', `API Url: ${url}`)
		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
				},
			})

			if (!response.ok) {
				this.log('error', `GET ${apimethod} failed with status ${response.status} ${response.statusText}`)
				return null
			}

			try {
				const data = await response.json()
				this.log('debug', `Response JSON: ${JSON.stringify(data)}`)
				return data
			} catch (jsonError) {
				this.log('warn', `Response is not valid JSON, attempting to read as text. Error: ${jsonError}`)
				const text = await response.text()
				this.log('debug', `Response Text: ${text}`)
				return text
			}
		} catch (error) {
			this.log('error', `GET ${apimethod} failed: ${error}`)
			return null
		}
	}

	async apiPost(apimethod: string, body: Record<string, unknown>): Promise<unknown> {
		this.log('debug', `Send POST request to ${apimethod}`)
		const url = this.generateRequestUrl(`http://${this.config.server}:${this.config.port}/${apimethod}`)
		this.log('debug', `API Url: ${url}`)
		this.log('debug', `Request-Body: ${JSON.stringify(body)}`)

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			})

			const text = await response.text()
			this.log('debug', `Response-Text: ${text}`)

			try {
				return JSON.parse(text)
			} catch {
				return text
			}
		} catch (error) {
			this.log('error', `POST ${apimethod} failed: ${error}`)
			return null
		}
	}
	async apiPut(apimethod: string, body: Record<string, unknown>): Promise<unknown> {
		this.log('debug', `Send PUT request to ${apimethod}`)
		const url = this.generateRequestUrl(`http://${this.config.server}:${this.config.port}/${apimethod}`)
		this.log('debug', `API Url: ${url}`)
		this.log('debug', `Request-Body: ${JSON.stringify(body)}`)

		try {
			const response = await fetch(url, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			})

			const text = await response.text()
			this.log('debug', `Response-Text: ${text}`)

			try {
				return JSON.parse(text)
			} catch {
				return text
			}
		} catch (error) {
			this.log('error', `PUT ${apimethod} failed: ${error}`)
			return null
		}
	}

	async apiDelete(apimethod: string, body: Record<string, unknown>): Promise<unknown> {
		this.log('debug', `Send DELETE request to ${apimethod}`)
		const url = this.generateRequestUrl(`http://${this.config.server}:${this.config.port}/${apimethod}`)
		this.log('debug', `API Url: ${url}`)
		this.log('debug', `Request-Body: ${JSON.stringify(body)}`)

		try {
			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			})

			const text = await response.text()
			this.log('debug', `Response-Text: ${text}`)

			try {
				return JSON.parse(text)
			} catch {
				return text
			}
		} catch (error) {
			this.log('error', `DELETE ${apimethod} failed: ${error}`)
			return null
		}
	}

	async apiDeleteWithoutBody(apimethod: string): Promise<unknown> {
		this.log('debug', `Send DELETE request to ${apimethod}`)
		const url = this.generateRequestUrl(`http://${this.config.server}:${this.config.port}/${apimethod}`)
		this.log('debug', `API Url: ${url}`)
		

		try {
			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			})

			const text = await response.text()
			this.log('debug', `Response-Text: ${text}`)

			try {
				return JSON.parse(text)
			} catch {
				return text
			}
		} catch (error) {
			this.log('error', `DELETE ${apimethod} failed: ${error}`)
			return null
		}
	}

	generateRequestUrl(requesturl: string): string {
		var request_url = requesturl
		if (this.config.key != "") {

			const salt = Math.floor(Math.random() * 1_000_001) // rand(0, 1000000)
			const str2hash = `${salt}/${this.config.key}`
			//const crypto = require('crypto')

			const md5raw = crypto.createHash('md5').update(str2hash).digest() // raw binary
			const base64hash = md5raw.toString('base64')

			request_url = `${requesturl}?salt=${salt}&hash=${base64hash}`
			this.log('debug', `Generated Request: ${request_url}`)
		}

		return request_url
	}



	//Methods to Update Variables:
	async updateServerStatus(): Promise<void> {
		try {
			const response = await this.apiGet('manage/server_status')

			if (!response) {
				this.log('error', 'No response from server_status endpoint')
				return
			}

			// Optionales Logging der Antwort (z. B. zu Debugzwecken)
			this.log('info', `Server status received: ${JSON.stringify(response)}`)

			// Hauptwerte
			if (typeof response.Connections === 'number') {
				this.setVariableValues({ connections: response.Connections })
			}
			if (typeof response.OutRate === 'number') {
				this.setVariableValues({ outRate: response.OutRate })
			}

			// Systeminformationen
			if (typeof response.SysInfo === 'object') {
				const sys = response.SysInfo
				this.setVariableValues({
					availableProcessors: sys.ap,
					systemCpuLoad: sys.scl,
					totalPhysicalMemory: sys.tpms,
					freePhysicalMemory: sys.fpms,
					totalSwapSpace: sys.tsss,
					freeSwapSpace: sys.fsss,
				})
			}

			this.log('info', 'Server status updated successfully.')
			this.updateStatus(InstanceStatus.Ok)

		} catch (err) {
			this.log('error', `Failed to fetch server status: ${err}`)
			this.updateStatus(InstanceStatus.UnknownError)

		}
	}

	//Cyclic Methods:

	async syncRepublishRules(): Promise<void> {
		try {
			const data = await this.apiGet('manage/rtmp/republish')

			if (!data || !Array.isArray(data.rules)) {
				this.log('error', 'Republish Rules API returned unexpected data')
				return
			}

			const rules = data.rules
			const newIds = new Set<string>(rules.map((rule: any) => rule.id))

			const idsEqual =
				newIds.size === this.republishRulesRawIds?.size &&
				[...newIds].every((id: any) => this.republishRulesRawIds.has(id))

			if (!idsEqual) {
				this.republishRulesCache = rules.map((rule: any) => ({
					id: rule.id,
					label: `[${rule.id}] ${rule.src_app}/${rule.src_stream} → ${rule.dest_addr}:${rule.dest_port}/${rule.dest_app}/${rule.dest_stream}`,
				}))
				this.republishRulesRawIds = newIds

				this.log('info', `Updated Republish Rules Cache with ${rules.length} entries`)
				this.updateActions()
			} else {
				this.log('debug', 'Republish Rules unchanged, no update needed.')
			}
		} catch (error) {
			this.log('error', `Failed to sync Republish Rules: ${error}`)
		}
	}





}

runEntrypoint(ModuleInstance, UpgradeScripts)
