/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

package sofeware.aws.solution.clickstream;

import com.clearspring.analytics.util.Lists;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.junit.jupiter.api.Test;
import static com.google.common.collect.Lists.newArrayList;
import static java.util.Objects.requireNonNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Date;
import java.util.List;

class ETLRunnerTest extends BaseSparkTest {

    @Test
    public void should_executeTransformers() throws URISyntaxException, IOException {
        System.setProperty("debug.local", "true");
        spark.sparkContext().addFile(requireNonNull(getClass().getResource("/GeoLite2-City.mmdb")).getPath());

        List<String> transformers = Lists.newArrayList();

        transformers.add("sofeware.aws.solution.clickstream.Transformer");
        transformers.add("sofeware.aws.solution.clickstream.UAEnrichment");
        transformers.add("sofeware.aws.solution.clickstream.IPEnrichment");

        String database = "fakeDatabase";
        String sourceTable = "fakeSourceTable";
        String jobDataUri = "/tmp/job-data";
        String transformerClassNames = String.join(",");
        String outputPath = "/tmp/test-output";
        String projectId = "projectId1";
        String validAppIds = "id1,id2,uba-app";
        String outPutFormat = "json";
        String startTimestamp = "1667963966000";
        String endTimestamp = "1667969999000";
        String dataFreshnessInHour ="72";
        String outputPartitions = "-1";

        ETLRunner.ETLRunnerConfig runnerConfig = new ETLRunner.ETLRunnerConfig(database, sourceTable, jobDataUri,
                newArrayList(transformerClassNames.split(",")),
                outputPath, projectId, validAppIds, outPutFormat, Long.valueOf(startTimestamp),
                Long.valueOf(endTimestamp), Long.valueOf(dataFreshnessInHour), Integer.valueOf(outputPartitions), -1);

        ETLRunner runner = new ETLRunner(spark, runnerConfig);
        String sql = runner.configAndSQL();

        String expectedSql= "select * from `fakeDatabase`.fakeSourceTable where (\n" +
                "(year='2022' AND month='11' AND day='09')\n" +
                ") AND ingest_time >= 1667963966000 AND ingest_time < 1667969999000";

        assertEquals(expectedSql, sql);
        Dataset<Row> sourceDataset =
                spark.read().json(requireNonNull(getClass().getResource("/original_data.json")).getPath());

        Dataset<Row> dataset  = runner.executeTransformers(sourceDataset, transformers);
        checkSchema(dataset);

        Row row = dataset.first();
        assertEquals(111L, row.getLong(row.fieldIndex("event_bundle_sequence_id")));
        String outPath = "/tmp/test-spark-etl" + new Date().getTime();
        runner.writeResult(outPath, dataset);
        assertTrue(Paths.get(outPath + "/partition_app=uba-app/partition_year=2023" +
                        "/partition_month=04/partition_day=13")
                .toFile().isDirectory());
    }

    private void checkSchema(Dataset<Row> dataset) throws IOException {
        dataset.printSchema();
        System.out.println(dataset.schema().toDDL());
        // app_info: STRUCT<app_id: STRING, id: STRING, install_source: STRING, version: STRING>
        // `app_info` struct<app_id:string,id:string,install_source:string,version:string>,

        String path = this.getClass().getResource("/ods_event.sql").getPath();
        String sqlContent = String.join("\n", Files.readAllLines(Paths.get(path)));
        String normalSqlContent = sqlContent.replaceAll("[``]", "");
        dataset.schema().foreach(d -> {
            // change 'app_info: STRUCT<app_id: STRING>' to 'app_info struct<app_id:string>'
            String fieldSql = d.sql().toLowerCase().replaceAll(" ", "")
                    .replaceAll("^" + d.name() + ":", d.name() + " ");
            boolean matchColDef = normalSqlContent.contains(fieldSql + ",") || normalSqlContent.contains(fieldSql + ")");
            if(matchColDef){
                System.out.println(d.name() + " OK");
            } else {
                System.err.println(fieldSql);
                System.err.println(d.name() + " is mismatch");
                System.out.println("cannot find below sql\n" + fieldSql + "\nin\n" + normalSqlContent);
            }
            assertTrue(matchColDef);
            return "";
        });

        System.out.println(dataset.schema().fieldNames());
        assertEquals(String.join(" ", dataset.schema().fieldNames()), String.join(" ", new String[] {
                "app_info",
                "device",
                "ecommerce",
                "event_bundle_sequence_id",
                "event_date",
                "event_dimensions",
                "event_id",
                "event_name",
                "event_params",
                "event_previous_timestamp",
                "event_server_timestamp_offset",
                "event_timestamp",
                "event_value_in_usd",
                "geo",
                "ingest_timestamp",
                "items",
                "platform",
                "privacy_info",
                "project_id",
                "traffic_source",
                "user_first_touch_timestamp",
                "user_id",
                "user_ltv",
                "user_properties",
                "user_pseudo_id",
        }));
    }


    @Test
    public void should_executeTransformers_with_error() {
        spark.sparkContext().addFile(requireNonNull(getClass().getResource("/GeoLite2-City.mmdb")).getPath());
        List<String> transformers = Lists.newArrayList();

        transformers.add("sofeware.aws.solution.clickstream.Transformer");
        transformers.add("sofeware.aws.solution.clickstream.UAEnrichment");
        transformers.add("sofeware.aws.solution.clickstream.IPEnrichment");

        String database = "fakeDatabase";
        String sourceTable = "fakeSourceTable";
        String jobDataUri = "/tmp/etl-debug/";
        String transformerClassNames = String.join(",");
        String outputPath = "/tmp/test-output";
        String projectId = "projectId1";
        String validAppIds = "id1,id2,uba-app";
        String outPutFormat = "json";
        String startTimestamp = "1667963966000";
        String endTimestamp = "1667969999000";
        String dataFreshnessInHour ="72";

        ETLRunner.ETLRunnerConfig runnerConfig = new ETLRunner.ETLRunnerConfig(database, sourceTable, jobDataUri,
                newArrayList(transformerClassNames.split(",")),
                outputPath, projectId, validAppIds, outPutFormat, Long.valueOf(startTimestamp),
                Long.valueOf(endTimestamp), Long.valueOf(dataFreshnessInHour), -1, -1);

        ETLRunner runner = new ETLRunner(spark, runnerConfig);
        runner.configAndSQL();
        Dataset<Row> sourceDataset =
                spark.read().json(requireNonNull(getClass().getResource("/original_data_with_error.json")).getPath());
        assertEquals(sourceDataset.count(), 1);
        Dataset<Row> dataset  = runner.executeTransformers(sourceDataset, transformers);
        assertEquals(dataset.count(), 0);
    }
}