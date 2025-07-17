import type { ModuleInstance } from './main.js'
//import { Regex } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		SyncPanelSettings: {
			name: 'Sync Panel Settings',
			description: 'Reload config from WMSPanel in Nimble Streamer',
			options: [],
			callback: async () => {
				try {
					const result = await self.apiPost('manage/sync_panel_settings', {})

					if (result) {
						self.log('info', 'Successfully triggered config sync')
					} else {
						self.log('warn', 'Config sync POST returned no result')
					}
				} catch (error) {
					self.log('error', `Failed to trigger config sync: ${error}`)
				}
			},
		},
		ReloadNimbleStreamerConfig: {
			name: 'Reload Nimble Streamer Config',
			description: 'Reload config in Nimble Streamer',
			options: [],
			callback: async () => {
				try {
					const result = await self.apiPost('manage/reload_config', {})

					if (result) {
						self.log('info', 'Successfully triggered config sync')
					} else {
						self.log('warn', 'Config sync POST returned no result')
					}
				} catch (error) {
					self.log('error', `Failed to trigger config sync: ${error}`)
				}
			},
		},
		ReloadSSLCertificates: {
			name: 'Reload Nimble Streamer SSL Certificates',
			description: 'Reload SSL Certificates in Nimble Streamer',
			options: [],
			callback: async () => {
				try {
					const result = await self.apiPost('manage/reload_ssl_certificates', {})

					if (result) {
						self.log('info', 'Successfully triggered SSL certificate reload')
					} else {
						self.log('warn', 'SSL Cert reload POST returned no result')
					}
				} catch (error) {
					self.log('error', `Failed to trigger SSL Cert reload: ${error}`)
				}
			},
		},

		createRTMPRepublishRule: {
			name: 'Create RTMP Re-publishing Rule',
			description: 'This method allows creating a new RTMP re-publishing rule. Notice that re-publishing setting defined by this API call are not persistent and they are reset after Nimble Streamer re-load. If you\'d like to keep them, you should use WMSPanel control API instead.',
			options: [
				{ id: 'src_app', type: 'textinput', label: 'Source App', default: '' },
				{ id: 'src_stream', type: 'textinput', label: 'Source Stream (optional)', default: '' },
				{ id: 'dest_addr', type: 'textinput', label: 'Destination Address', default: '' },
				{ id: 'dest_port', type: 'number', label: 'Destination Port', min: 1, max: 65535, default: 1935 },
				{ id: 'dest_app', type: 'textinput', label: 'Destination App', default: '' },
				{ id: 'dest_stream', type: 'textinput', label: 'Destination Stream', default: '' },
				{ id: 'dest_app_params', type: 'textinput', label: 'Destination App Params', default: '' },
				{ id: 'dest_stream_params', type: 'textinput', label: 'Destination Stream Params', default: '' },
				{
					id: 'auth_schema',
					type: 'dropdown',
					label: 'Auth Schema',
					default: 'NONE',
					choices: [
						{ id: 'NONE', label: 'None' },
						{ id: 'NIMBLE', label: 'Nimble' },
						{ id: 'AKAMAI', label: 'Akamai' },
						{ id: 'LIMELIGHT', label: 'Limelight' },
						{ id: 'PERISCOPE', label: 'Periscope' },
					],
				},
				{ id: 'dest_login', type: 'textinput', label: 'Destination Login', default: '' },
				{ id: 'dest_password', type: 'textinput', label: 'Destination Password', default: '', },
				{ id: 'keep_src_stream_params', type: 'checkbox', label: 'Keep Source Stream Params', default: false },
				{ id: 'ssl', type: 'checkbox', label: 'Use SSL', default: false },
			],
			callback: async (event) => {
				const o = event.options

				const payload = {
					src_app: o.src_app,
					src_stream: o.src_stream || undefined,
					dest_addr: o.dest_addr,
					dest_port: Number(o.dest_port),
					dest_app: o.dest_app,
					dest_stream: o.dest_stream,
					dest_app_params: o.dest_app_params || undefined,
					dest_stream_params: o.dest_stream_params || undefined,
					auth_schema: o.auth_schema,
					dest_login: o.dest_login || undefined,
					dest_password: o.dest_password || undefined,
					keep_src_stream_params: o.keep_src_stream_params === true,
					ssl: o.ssl === true,
				}

				try {
					const result = await self.apiPost('manage/rtmp/republish', payload)
					self.log('info', `Republish rule created: ${JSON.stringify(result)}`)
				} catch (error) {
					self.log('error', `Failed to create republish rule: ${error}`)
				}
			},
		},

		DeleteRepublishRule: {
			name: 'Delete Republish Rule',
			options: [
				{
					id: 'rule_id',
					type: 'dropdown',
					label: 'Select Republish Rule',
					choices: self.republishRulesCache,
					default: self.republishRulesCache[0]?.id ?? '',
				},
			],
			callback: async (event) => {
				const o = event.options
				const ruleId = String(o.rule_id ?? '')

				if (!ruleId) {
					self.log('error', `No Republish Rule selected, aborting delete.`)
					return
				}

				const apiPath = `manage/rtmp/republish/${ruleId}`
				await self.apiDeleteWithoutBody(apiPath)

				await self.syncRepublishRules() // Aktualisiere Cache nach Löschung
			},
		}

	})
}
