import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	server: string,
	key: string,
	port: number,
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'server',
			label: 'Server',
			width: 100,
			regex: Regex.SOMETHING,
		},
		{
			type: 'textinput',
			id: 'key',
			tooltip: 'Optional Management Token',
			label: 'Management-Token',
			width: 100,
			required: false,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Nimble Streamer API Port',
			tooltip: 'Default 8081',
			default: 8081,
			min: 0,
			max: 65535,
			width: 4,
		}

	]
}
