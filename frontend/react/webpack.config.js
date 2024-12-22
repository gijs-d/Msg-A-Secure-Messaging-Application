const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
module.exports = {
    mode: 'development',
    entry: './src/index.jsx',
    watch: true,
    watchOptions: {
        aggregateTimeout: 3000,
        poll: 3000,
    },

    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },

    devServer: {
        port: 443,
        // https: {
        //     key: fs.readFileSync('cert.key'),
        //     cert: fs.readFileSync('cert.crt'),
        //     ca: fs.readFileSync('ca.crt'),
        // },
        webSocketServer: false,
        historyApiFallback: true,
        hot: true,
        open: true,
        proxy: {
            '/api': {
                target: 'http://localhost:8000/',
                pathRewrite: { '^/api': '' },
                logLevel: 'debug' /*optional*/,
            },
        },
    },

    output: {
        filename: 'bundle.[hash].js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
        }),
    ],
    resolve: {
        modules: [__dirname, 'src', 'node_modules'],
        extensions: ['*', '.js', '.jsx', '.tsx', '.ts'],
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: require.resolve('babel-loader'),
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.png|svg|jpg|gif$/,
                use: ['file-loader'],
            },
        ],
    },
};
