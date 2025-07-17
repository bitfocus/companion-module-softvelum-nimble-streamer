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
	})
}
