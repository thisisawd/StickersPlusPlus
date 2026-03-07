const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devCerts = require("office-addin-dev-certs");

const isProduction = process.env.NODE_ENV === "production";

// Load .env file
function loadEnv() {
  const envPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
}
loadEnv();

module.exports = async () => {
  // Get trusted dev certificates for HTTPS
  const httpsOptions = await devCerts.getHttpsServerOptions();

  return {
    mode: isProduction ? "production" : "development",
    entry: {
      taskpane: "./src/taskpane/taskpane.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].bundle.js",
      clean: true,
    },
    resolve: {
      extensions: [".js"],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                ["@babel/preset-env", {
                  targets: {
                    ie: "11",
                    edge: "18",
                    chrome: "70",
                  },
                  useBuiltIns: "usage",
                  corejs: 3,
                }],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext]",
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __AZURE_AI_KEY__: JSON.stringify(process.env.AZURE_AI_KEY || ""),
      }),
      new HtmlWebpackPlugin({
        template: "./src/taskpane/taskpane.html",
        filename: "taskpane.html",
        chunks: ["taskpane"],
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets",
            to: "assets",
            noErrorOnMissing: true,
          },
          {
            from: "manifest.xml",
            to: "manifest.xml",
          },
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
        "Access-Control-Allow-Private-Network": "true",
      },
      setupMiddlewares: (middlewares, devServer) => {
        // Handle preflight requests for Private Network Access
        devServer.app.use((req, res, next) => {
          if (req.method === "OPTIONS") {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Private-Network", "true");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, content-type, Authorization");
            res.status(204).end();
            return;
          }
          next();
        });
        return middlewares;
      },
      server: {
        type: "https",
        options: httpsOptions,
      },
      port: 3001,
      hot: true,
      open: false,
      allowedHosts: "all",
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};
