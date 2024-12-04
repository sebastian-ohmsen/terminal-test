import mkcert from 'vite-plugin-mkcert'

/** @type {import('vite').UserConfig} */
export default {
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler'
            }
        }
    },
    plugins: [ mkcert() ]
}