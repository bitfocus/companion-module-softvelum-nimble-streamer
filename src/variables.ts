import type { ModuleInstance } from './main.js'

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	self.setVariableDefinitions([
		{ variableId: 'connections', name: 'Active Connections' },
		{ variableId: 'outRate', name: 'Outgoing Bitrate (bps)' },
		{ variableId: 'availableProcessors', name: 'Available Processors' },
		{ variableId: 'systemCpuLoad', name: 'System CPU Load' },
		{ variableId: 'totalPhysicalMemory', name: 'Total Physical Memory' },
		{ variableId: 'freePhysicalMemory', name: 'Free Physical Memory' },
		{ variableId: 'totalSwapSpace', name: 'Total Swap Space' },
		{ variableId: 'freeSwapSpace', name: 'Free Swap Space' },
	])
}
