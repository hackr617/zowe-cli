/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { runCliScript, stripNewLines } from "../../../../../../../__tests__/__src__/TestUtils";
import { TestEnvironment } from "../../../../../../../__tests__/__src__/environment/TestEnvironment";
import { ITestEnvironment } from "../../../../../../../__tests__/__src__/environment/doc/response/ITestEnvironment";
import { TestProperties } from "../../../../../../../__tests__/__src__/properties/TestProperties";
import { ITestSystemSchema } from "../../../../../../../__tests__/__src__/properties/ITestSystemSchema";
import { IO } from "@brightside/imperative";

let testEnvironment: ITestEnvironment;
let systemProps: TestProperties;
let host: string;
let port: number;
let user: string;
let pass: string;


describe("zosmf list systems", () => {

    // Create the unique test environment
    beforeAll(async () => {
        testEnvironment = await TestEnvironment.setUp({
            tempProfileTypes: ["zosmf"],
            testName: "zos_list_systems"
        });

        systemProps = new TestProperties(testEnvironment.systemTestProperties);
        host = systemProps.getDefaultSystem().zosmf.host;
        port = systemProps.getDefaultSystem().zosmf.port;
        user = systemProps.getDefaultSystem().zosmf.user;
        pass = systemProps.getDefaultSystem().zosmf.pass;
    });

    afterAll(async () => {
        await TestEnvironment.cleanUp(testEnvironment);
    });

    describe("without profiles", () => {

        // Create a separate test environment for no profiles
        let TEST_ENVIRONMENT_NO_PROF: ITestEnvironment;
        let DEFAULT_SYSTEM_PROPS: ITestSystemSchema;

        beforeAll(async () => {
            TEST_ENVIRONMENT_NO_PROF = await TestEnvironment.setUp({
                testName: "zos_list_systems_command_without_profiles"
            });

            const sysProps = new TestProperties(TEST_ENVIRONMENT_NO_PROF.systemTestProperties);
            DEFAULT_SYSTEM_PROPS = sysProps.getDefaultSystem();
        });

        afterAll(async () => {
            await TestEnvironment.cleanUp(TEST_ENVIRONMENT_NO_PROF);
        });

        it("should successfully list systems with options only on the command line", async () => {
            const opts = [
                "--host", DEFAULT_SYSTEM_PROPS.zosmf.host,
                "--port", DEFAULT_SYSTEM_PROPS.zosmf.port,
                "--user", DEFAULT_SYSTEM_PROPS.zosmf.user,
                "--password", DEFAULT_SYSTEM_PROPS.zosmf.pass,
                "--reject-unauthorized", DEFAULT_SYSTEM_PROPS.zosmf.rejectUnauthorized
            ];

            if (DEFAULT_SYSTEM_PROPS.zosmf.basePath != null) {
                opts.push("--base-path");
                opts.push(DEFAULT_SYSTEM_PROPS.zosmf.basePath);
            }

            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems_use_cli_opts.sh",
                TEST_ENVIRONMENT_NO_PROF, opts
            );
            expect(response.stderr.toString()).toBe("");
            expect(response.status).toBe(0);
            expect(response.stdout.toString()).toContain("Number of retreived system definitions");
        });
    });

    describe("Success scenarios", () => {

        it("should display number of defined z/OSMF systems", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems.sh", testEnvironment);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Number of retreived system definitions");
        });

        it("should display number of defined z/OSMF systems and print attributes", async () => {
            const response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems.sh", testEnvironment, ["--rfj"]);
            expect(response.stderr.toString()).toBe("");
            expect(response.stdout.toString()).toContain("Number of retreived system definitions");
        });
    });

    describe("Expected failures", () => {

        it("should fail due to invalid port", async () => {
            // create a temporary zowe profile with an invalid port
            const scriptPath = testEnvironment.workingDir + "_create_profile_invalid_port";
            const bogusPort = 12345;
            const command = "zowe profiles create zosmf " + host + "temp --host " + host + " --port " + bogusPort
                + " --user " + user + " --password " + pass + " --ru false";
            await IO.writeFileAsync(scriptPath, command);
            let response = runCliScript(scriptPath, testEnvironment);
            expect(response.status).toBe(0);
            // default to the temporary profile
            await IO.writeFileAsync(scriptPath, "zowe profiles set  zosmf " + host + "temp");
            response = runCliScript(scriptPath, testEnvironment);
            expect(response.status).toBe(0);
            // now check the status
            response = runCliScript(__dirname + "/__scripts__/command/zosmf_list_systems.sh", testEnvironment);
            expect(stripNewLines(response.stderr.toString())).toContain("connect ECONNREFUSED");
        });
    });
});
