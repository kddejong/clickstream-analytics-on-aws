# Apache Kafka
该数据宿将从摄取端点收集的点击流数据流式传输到 Kafka 集群中的一个主题。
目前，该解决方案支持 Amazon Managed Streaming for Apache Kafka (Amazon MSK)。

## Amazon MSK
* **选择现有的 Amazon MSK 集群。** 从下拉列表中选择一个 MSK 集群，该 MSK 集群需要满足以下要求：
    * MSK 集群和此解决方案需要在同一个 VPC 中。
    * 在访问控制方法中启用**无身份验证访问**。
    * 在加密中启用**明文**。
    * 在 MSK 集群配置中将 **auto.create.topics.enable** 设置为 `true`。此配置设置 MSK 集群是否可以自动创建主题。或者在创建数据管道之前，您需要在Kafka集群中提前创建特定的主题。
    * **default.replication.factor** 的值不能大于 MKS 集群代理的数量。

    **注意**：如果没有 MSK 集群，用户需要按照以上要求创建一个 MSK 集群。

* **主题：** 用户可以指定主题名称。默认情况下，该解决方案将创建一个名为“project-id”的主题。

## 连接器
启用解决方案创建 Kafka 连接器和自定义插件。此连接器将从 Kafka 集群中的数据汇入 S3 存储桶中。

## 其他设置：
* **接收器最大间隔：** 指定在流式传输到 AWS 服务之前记录应缓冲的最长时间（以秒为单位）。
* **批处理大小：** 在单个批次中传送的记录数的最大值。
