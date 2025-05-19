export interface CompanionContainerDefinition {
  /**
   * Alias of the container in the app.
   */
  name: string;

  /**
   * Image to use for the container.
   */
  image: string;

  /**
   * Port exposed by the provided image.
   *
   * E.g., if the Dockerfile of the image contains `EXPOSE 3000`
   * then `port` should be 3000 as well.
   */
  port: number;

  /**
   * Limits the resources used and required by companion containers
   *
   */
  resources?: ContainerResources;

  /**
   * Environment within the container
   */
  env?: ContainerEnvVar[];

  /**
   * Additional properties e.g., labels, annotations
   *
   */
  metadata?: Record<string, any>;
}

export interface ContainerResources {
  /**
   * Maximum amount of resources allowed
   */
  limits: ContainerResourceProps;
}

export interface ContainerResourceProps {
  cpu: string;
  memory: string;
}

export interface ContainerEnvVar {
  name: string;
  value: string;
  useValueFromSecret?: boolean;
}
