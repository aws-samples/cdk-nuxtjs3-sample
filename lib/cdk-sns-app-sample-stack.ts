import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { execSync } from "child_process";
import { Construct } from "constructs";
import { readFileSync } from "fs";

export class CdkSnsAppSampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const boyakiTable = new Table(this, "BoyakiTable", {
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp",
        type: AttributeType.NUMBER,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    const { s3Bucket, cloudFrontWebDistribution } = new CloudFrontToS3(
      this,
      "CloudFrontS3",
      {
        insertHttpSecurityHeaders: false,
      }
    );
    const api = new HttpApi(this, "HttpApi", {
      corsPreflight: {
        // https://xxxx.cloudfront.net
        allowOrigins: [`https://${cloudFrontWebDistribution.domainName}`],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
        allowHeaders: ["Content-Type"],
      },
    });

    // API GatewayのURLを示すトークンを埋め込みつつNuxtアプリをビルドする
    // トークンについて https://docs.aws.amazon.com/cdk/v2/guide/tokens.html
    execSync(`API_ENDPOINT='${api.url}' npm run build`, {
      cwd: "webapp",
    });
    // index.htmlに出力されたトークンをデプロイ時の値で解決する
    const html = Source.data(
      "index.html",
      readFileSync("webapp/.output/public/index.html").toString()
    );

    const backend = new Function(this, "Backend", {
      handler: "index.handler",
      runtime: Runtime.NODEJS_18_X,
      code: Code.fromAsset("webapp/.output/server"),
      environment: {
        BOYAKI_TABLE_NAME: boyakiTable.tableName,
      },
    });
    boyakiTable.grantReadWriteData(backend);
    api.addRoutes({
      path: "/api/{proxy+}",
      integration: new HttpLambdaIntegration("BackendIntegration", backend),
      methods: [HttpMethod.GET, HttpMethod.POST],
    });
    new BucketDeployment(this, "Deployment", {
      destinationBucket: s3Bucket!,
      distribution: cloudFrontWebDistribution,
      sources: [Source.asset("webapp/.output/public"), html],
    });
    new CfnOutput(this, "Url", {
      value: `https://${cloudFrontWebDistribution.domainName}`,
    });
  }
}
