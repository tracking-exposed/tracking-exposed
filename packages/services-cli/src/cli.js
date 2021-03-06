// @flow
import yargs from "yargs";
import findUp from "find-up";
import fs from "fs";

export default () => {
  const configPath = findUp.sync([".servicesrc", ".services.json"]);
  const config = configPath
    ? JSON.parse(fs.readFileSync(configPath).toString())
    : {};

  return yargs
    .command("start", "Start up a HTTP service", (y) =>
      y
        .option("port", {
          default: 3000,
          type: "number",
          desc: "The port to listen on.",
        })
        .alias("port", "p")
        .option("service", {
          required: true,
          type: "string",
          desc: "Run a service using this service handler.",
        })
        .alias("service", "s"),
    )
    .option("redis-host", {
      default: "localhost",
      type: "string",
      desc: "The host name of the Redis instance.",
    })
    .options("redis-port", {
      default: 6379,
      type: "number",
      desc: "The port of the Redis instance.",
    })
    .option("data-path", {
      default: "/tmp",
      type: "string",
      desc: "The path to the data base directory.",
    })
    .config(config)
    .env("TREX")
    .pkgConf("service")
    .demandCommand()
    .help()
    .wrap(72);
};
