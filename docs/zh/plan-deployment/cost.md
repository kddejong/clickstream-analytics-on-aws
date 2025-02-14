---
title: "成本"
weight: 1

---

!!! info "重要提示"

    以下的成本估算仅为示例，实际成本可能因环境而异。

您需要承担运行此解决方案时使用的 AWS 服务的费用。 部署此解决方案只会在您的 AWS 账户中创建一个解决方案 Web 控制台，该控制台是无服务器架构，通常AWS的免费套餐可以覆盖成本。

该解决方案的大部分成本是由数据管道产生的。 截至本次修订，影响解决方案成本的主要因素包括：

- **摄入模块**，费用取决于摄入服务器的大小和所选择的数据宿类型。

- **数据处理和建模模块**（可选），费用取决于您是否选择启用此模块以及相关配置。

- **启用的仪表板**（可选），费用取决于您是否选择启用此模块以及相关配置。

- **点击流数据的数量**

- **附加功能**

以下是以不同数据管道配置的每日数据量为10/100/1000个请求每秒（RPS）的成本估算。成本估算由模块提供。根据您的实际配置，按模块累加成本以获得您的用例的总成本。

!!! info "重要提示"

    截至本修订版，以下成本是使用`On-Demand`价格在`us-east-1`区域以美元计量的。

## 摄入模块

摄入模块包括以下成本组成部分：

- 应用程序负载均衡器
- 用于ECS的EC2实例
- 数据宿 - Data sink（Kinesis Data Streams | Kafka | 直接到S3）
- S3存储
- 数据传输出（DTO）

主要假设包括：

- 请求有效载荷：1KB（压缩后，1:10的比例）
- MSK配置（m5.large * 2）
- KDS配置（按需，预配 - 2 分片数）
- 10/100/1000 RPS

| 每日数据量/每秒请求数（RPS） | ALB 费用  | EC2 费用 |  缓冲类型（Buffer type） | 缓冲费用（Buffer cost） | S3 费用   |   总计（美元/月） |
| ------------------ | --- | ---- | ------------- | ----------- | ---  |  --------- |
| 10RPS             |   $7  | $122   |  Kinesis（按需） |    $36         |   $3   |     $168  |
|                   |   $7  |  $122  |  Kinesis (预备 2 shard)   |      $22       |  $3   |     $154  |
|                   |   $7  |  $122  |  MSK (m5.large * 2, connector MCU * 1)   |       $417      |   $3  |    $549   |
|                   |   $7  |  $122  |  无缓冲              |             |  $3    |      $132   |
|100RPS             |   $43 |  $122  |      Kinesis（按需）              |      $86       |  $3   |     $254 |
|                   | $43    |   $122  |  Kinesis (预备 2 shard)   |      $26       | $3    |     $194  |
|           |   $43  |  $122  |      MSK (m5.large * 2, connector MCU * 1)              |      $417       |  $3   |     $585
|           |   $43  |  $122 |      无缓冲              |             |  $3    |     $168
|1000RPS           |   $396  |   $122 |      Kinesis（按需）              |      $576       |  $14   |    $1108 |
|                         |  $396   |  $122  |  Kinesis (预备 10 shard)   |    $146         |   $14  |     $678  |
|           |  $396   | $122  |      MSK (m5.large * 2, connector MCU * 2~3)              |      $530       |  $14  |     $1062
|           |  $396   | $122 |      无缓冲              |            |  $14   |     $532


### 数据传输
当数据通过EC2发送到下游的数据宿，会产生数据的费用。下面是以1000RPS，每个请求的有效载荷为1KB为例的费用。

1. EC2 网络输入：此部分不产生费用
2. EC2 网络输出，有如下三种数据宿的情况：

    | 数据宿 | 接入数据宿方法 |  费用说明 |   总计（美元/月）|
    | ------------------ | --- | --- | ---  |  
    | S3         |  S3 Gateway endpoints | The S3 Gateway endpoints 不会产生数据传输费用   | $0  |  
    | MSK          |  |  数据传输费用（$0.010 per GB in/out/between EC2 AZs） | $105  |       
    | KDS          |  NAT |  NAT 固定费用： $64（2 Availability Zones and a NAT per AZ, $0.045 per NAT Gateway Hour）. <br> 数据传输费用：$601（$0.045 per GB Data Processed by NAT Gateways）.  | $665  | 
    | KDS          |  VPC Endpoint |  VPC Endpoint 固定费用：$14.62 （Availability Zones $0.01 per AZ Hour）. <br> 数据传输费用: $133.5($0.01 per GB Data Processed by Interface endpoints).  | $148.1  | 

    我们建议通过VPC endpoint传输数据到KDS。请参考[VPC endpoint][vpce]获取更多信息。       

## 数据处理与建模模块

如果启用数据处理与建模模块，将包括以下费用组成部分：

- EMR Serverless

- Redshift

主要假设包括：

- 10/100/1000 RPS
- 数据处理间隔：每小时/每6小时/每日
- EMR运行三个内置插件来处理数据

| 每日数据量/每秒请求数 (RPS) | EMR调度间隔 |  EMR 费用 | Redshift类型 | Redshift 费用 | 总计 (美元/月) |
| ----------------------- | --------------------- | -------- | ------------------------ | ------------- | ----- |
| 10RPS             | 每小时                |     $28     | 无服务器 (基于8个RPU) |     $68          |   $96    |
|                         | 每6小时              |     $10.8     | 无服务器 (基于8个RPU)               |       $11        |   $21.8    |
|                         | 每日                 |      $9.6    | 无服务器 (基于8个RPU)               |     $3          |   $12.6    |
| 100RPS             | 每小时                |      $72   | 无服务器 (基于8个RPU) |       $70        |  $142    |
|                         | 每6小时              |     $61.2     | 无服务器 (基于8个RPU)               |       $17.2        |   $78.4    |
|                         | 每日                 |     $43.7     | 无服务器 (基于8个RPU)               |       $12.4        |    $56.1   |
| 1000RPS             | 每小时                |      $842   | 无服务器 (基于8个RPU) |       $172        |  $1014    |
|              | 每6小时                |      $579   | 无服务器 (基于8个RPU) |       $137        | $716
| <span style="background-color: lightgray">本条目的EMR使用了下面的配置</span>             | 每日                |      $642   | 无服务器 (基于8个RPU) |       $94        | $736 |

!!! info "提示"

    对于1000 PRS 每日的费用，为使用了如下EMR配置的费用。

    ```json
    {
    "sparkConfig": [
            "spark.emr-serverless.executor.disk=200g",
            "spark.executor.instances=16",
            "spark.dynamicAllocation.initialExecutors=16",
            "spark.executor.memory=100g",
            "spark.executor.cores=16",
            "spark.network.timeout=10000000",
            "spark.executor.heartbeatInterval=10000000",
            "spark.shuffle.registration.timeout=120000",
            "spark.shuffle.registration.maxAttempts=5",
            "spark.shuffle.file.buffer=2m",
            "spark.shuffle.unsafe.file.output.buffer=1m"
        ],
        "inputRePartitions": 800
    }
    ```

## 仪表板

如果您选择启用，仪表板模块包括以下成本组成部分：

- QuickSight

关键假设包括：

- QuickSight企业版
- 不包括Q成本
- **两个作者**每月订阅
- **十个读者**，每月工作22天，其中5%为活跃读者，50%为经常读者，25%为偶尔读者，20%为不活跃读者
- 10GB的SPICE容量

| 每日数据量/每秒请求数 (RPS) | 作者 | 读者 | SPICE | 总计（美元/月） |
| --------------------- | ------- | ------- | ----- | ----- |
| 所有大小              | 48      | 18.80      |   0    |   $66.80    |

!!! info "提示"
    所有数据管道都适用于以上 QuickSight 费用，即使是在解决方案之外管理的可视化内容也是如此。

## 日志和监控

方案使用CloudWatch Logs，CloudWatch Metrics和CloudWatch Dashboard来实现日志，监控，展示功能，合计费用约为每月约14美元，根据Logs的使用量和Metrics的数量会有一定浮动。

## 额外功能

只有在您选择启用以下功能时，您才会被收取额外费用。

### Secrets Manager

- 如果您启用了报告功能，该解决方案将在 Secrets Manager 中创建一个密钥，用于存储 QuickSight 可视化使用的 Redshift 凭据。**费用**：0.4 美元/月。

- 如果您启用了摄入模块的身份验证功能，您需要在 Secrets Manager 中创建一个密钥，用于存储 OIDC 的信息。**费用**：0.4 美元/月。

### Amazon全球加速器

它产生固定的按小时费用和按每日数据传输量的费用。

关键假设：

- 接入部署在`us-east-1`

| 每日数据量/RPS | 固定每小时费用 | 数据传输费用 | 总费用（美元/月） |
| --------------------- | ----------------- | ------------------ | ---------- |
| 10RPS           |        $18           |          $0.3          |       $18.3     |
| 100RPS         |          $18         |           $3         |      $21      |
| 1000RPS       |            $18       |            $30        |      $38      |

### 应用负载均衡器访问日志

您需要为 Amazon S3 的存储费用付费，但无需为 Elastic Load Balancing 用于将日志文件发送到 Amazon S3 的带宽使用付费。有关存储费用的更多信息，请参阅 [Amazon S3 定价](https://aws.amazon.com/s3/pricing/)。

| 每日数据量/RPS | 日志大小 | S3 费用（美元/月） |
| --------------------- | -------- | ------- |
| 10 RPS           |    16.5       |    $0.38     |
| 100 RPS         |     165     |      $3.8   |
| 1000 RPS       |     1650     |    $38     |

[vpce]: https://docs.aws.amazon.com/whitepapers/latest/aws-privatelink/what-are-vpc-endpoints.html