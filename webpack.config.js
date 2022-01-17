const path = require("path");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const appDirectory = fs.realpathSync(process.cwd());

module.exports = {
    entry: path.resolve(appDirectory, "src/index.ts"),
    output: {
        filename: "main.js",
        path: path.resolve(__dirname, 'build'),
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            'fs': false,
            'path': false,
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "index.html", to: "index.html"},
                { from: "particles/systems/explosion.json", to: "particles/systems/explosion.json" },
                { from: "textures/", to: "textures/" },
                { from: "Blender/Barrel/BarrelWholeAndPieces.glb", to: "Blender/Barrel/BarrelWholeAndPieces.glb"},
                { from: "Blender/BigApe/BigApeExport2.glb", to: "Blender/BigApe/BigApeExport2.glb" },
                { from: "Blender/Numbers/Numbers.glb", to: "Blender/Numbers/Numbers.glb" },
                { from: "Blender/Tree/Tree2.glb", to: "Blender/Tree/Tree2.glb" },
            ]
        })
    ],
    devServer: {
        contentBase: path.resolve(__dirname,"./build"),
        port: 8080,
    },
    mode: "development",
};