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

package software.aws.solution.clickstream;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.io.Resources;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;

import java.io.*;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Date;
import java.util.stream.Collectors;
import java.util.zip.GZIPInputStream;

import static java.util.Objects.requireNonNull;
import static software.aws.solution.clickstream.ContextUtil.*;

public class BaseSparkTest {
    protected SparkSession spark;

    @BeforeAll
    public static void downloadResources() {
       if (!needDownloadFile()) {
           return;
       }
        System.out.println("download GeoLite2-City.mmdb.gz...");
        String dbFile = downloadFile("https://cdn.jsdelivr.net/npm/geolite2-city@1.0.0/GeoLite2-City.mmdb.gz");
        System.out.println("download completed, " + dbFile);
    }

    public static String downloadFile(String urlStr) {
        String dbFile = new File(BaseSparkTest.class.getResource("/original_data.json").getPath())
                .getParent() + "/GeoLite2-City.mmdb";
        System.out.println(dbFile);
        try (
                FileOutputStream fs = new FileOutputStream(dbFile)
        ) {
            URL url = new URL(urlStr);
            URLConnection conn = url.openConnection();
            InputStream inStream = conn.getInputStream();
            GZIPInputStream gis = new GZIPInputStream(inStream);
            BufferedInputStream bufferedInputStream = new BufferedInputStream(gis);

            byte[] buffer = new byte[1024];
            int byteRead;
            while ((byteRead = bufferedInputStream.read(buffer)) != -1) {
                fs.write(buffer, 0, byteRead);
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException(e);
        }
        return dbFile;
    }

    @BeforeEach
    public void init() {
        System.setProperty(JOB_NAME_PROP, "test-job");
        System.setProperty(WAREHOUSE_DIR_PROP, "/tmp/warehouse");
        String dbName = "test_db";
        System.setProperty(DATABASE_PROP, dbName);
        System.setProperty(USER_KEEP_DAYS_PROP, String.valueOf(180));
        System.setProperty(ITEM_KEEP_DAYS_PROP, String.valueOf(180));

        spark = SparkSession.builder()
                .appName("Test Spark App")
                .master("local[*]")
                .config("spark.driver.bindAddress", "127.0.0.1")
                .config("spark.sql.warehouse.dir", ContextUtil.getWarehouseDir())
                .enableHiveSupport()
                .getOrCreate();
        spark.sql("DROP DATABASE IF EXISTS " + dbName + " CASCADE");
        spark.sql("CREATE DATABASE IF NOT EXISTS " + dbName);
    }

    @AfterEach
    public void clear() {
        spark.stop();
    }

    public static boolean needDownloadFile(){
       String dfile = System.getenv("DOWNLOAD_FILE");
       if ("false".equals(dfile) || "0".equals(dfile)) {
           return false;
       }
        return true;
    }

    public String resourceFileAsString(final String fileName) throws IOException {
        ObjectMapper om = new ObjectMapper();
        String jsonStr = Resources.toString(getClass().getResource(fileName), StandardCharsets.UTF_8).trim();
        return om.readTree(jsonStr).toPrettyString();
    }

    public String datasetToPrettyJson(Dataset<Row> dataset) throws JsonProcessingException {
        String rowsJson = dataset.collectAsList().stream().map(Row::prettyJson).collect(Collectors.joining(",\n"));
        rowsJson = "[" + rowsJson + "]";
        ObjectMapper om = new ObjectMapper();
        rowsJson = om.readTree(rowsJson).toPrettyString();
        return rowsJson;
    }
}
