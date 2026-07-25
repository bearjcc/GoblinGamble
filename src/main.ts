import './styles/theme.css'
import { startApp } from './ui/app.ts'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
startApp()
