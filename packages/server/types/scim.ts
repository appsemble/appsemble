export interface ScimMeta {
  /**
   * The name of the resource type of the resource. This attribute has a mutability of `readOnly`
   * and `caseExact` as `true`.
   */
  resourceType: string;

  /**
   * The `DateTime` that the resource was added to the service provider. This attribute **MUST** be
   * a DateTime.
   */
  created?: string;

  /**
   * The most recent DateTime that the details of this resource were updated at the service
   * provider. If this resource has never been modified since its initial creation, the value
   * **MUST** be the same as the value of `created`.
   */
  lastModified?: string;

  /**
   * The URI of the resource being returned. This value **MUST** be the same as the
   * `Content-Location` HTTP response header (see
   * [Section 3.1.4.2 of [RFC7231]](https://datatracker.ietf.org/doc/html/rfc7231#section-3.1.4.2)).
   */
  location: string;

  /**
   * The version of the resource being returned. This value must be the same as the entity-tag
   * (ETag) HTTP response header (see Sections
   * [2.1](https://datatracker.ietf.org/doc/html/rfc7643#section-2.1) and
   * [2.3](https://datatracker.ietf.org/doc/html/rfc7643#section-2.3) of
   * [[RFC7232](https://datatracker.ietf.org/doc/html/rfc7232)]). This attribute has `caseExact` as
   * `true`. Service provider support for this attribute is optional and subject to the service
   * provider’s support for versioning (see
   * [Section 3.14 of [RFC7644]](https://datatracker.ietf.org/doc/html/rfc7644#section-3.14)). If a
   * service provider provides `version` (entity-tag) for a representation and the generation of
   * that entity-tag does not satisfy all of the characteristics of a strong validator (see
   * [Section 2.1 of [RFC7232]](https://datatracker.ietf.org/doc/html/rfc7232#section-2.1)), then
   * the origin server **MUST** mark the `version` (entity-tag) as weak by prefixing its opaque
   * value with `W/` (case sensitive).
   */
  version?: string;
}

/**
 * Each SCIM resource (Users, Groups, etc.) includes the following common attributes. With the
 * exception of the `ServiceProviderConfig` and `ResourceType` server discovery endpoints and their
 * associated resources, these attributes **MUST** be defined for all resources, including any
 * extended resource types. When accepted by a service provider (e.g., after a SCIM create), the
 * attributes `id` and `meta` (and its associated sub-attributes) **MUST** be assigned values by the
 * service provider. Common attributes are considered to be part of every base resource schema and
 * do not use their own `schemas` URI.
 *
 * For backward compatibility, some existing schema definitions **MAY** list common attributes as
 * part of the schema. The attribute characteristics (see
 * [Section 2.2](https://datatracker.ietf.org/doc/html/rfc7643#section-2.2)) listed here **SHALL**
 * take precedence over older definitions that may be included in existing schemas.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7643#section-3.1
 */
export interface ScimResource {
  /**
   * A unique identifier for a SCIM resource as defined by the service provider. Each representation
   * of the resource **MUST** include a non-empty `id` value. This identifier **MUST** be unique
   * across the SCIM service provider’s entire set of resources. It **MUST** be a stable,
   * non-reassignable identifier that does not change when the same resource is returned in
   * subsequent requests. The value of the `id` attribute is always issued by the service provider
   * and **MUST NOT** be specified by the client. The string `bulkId` is a reserved keyword and
   * **MUST NOT** be used within any unique identifier value. The attribute characteristics are
   * `caseExact` as `true`, a mutability of `readOnly`, and a `returned` characteristic of `always`.
   * See [Section 9](https://datatracker.ietf.org/doc/html/rfc7643#section-9) for additional
   * considerations regarding privacy.
   */
  id?: string;

  /**
   *A String that is an identifier for the resource as defined by the provisioning client. The
   * `externalId` may simplify identification of a resource between the provisioning client and the
   * service provider by allowing the client to use a filter to locate the resource with an
   * identifier from the provisioning domain, obviating the need to store a local mapping between
   * the  provisioning domain’s identifier of the resource and the identifier used by the service
   * provider. Each resource **MAY** include a non-empty `externalId` value. The value of the
   * `externalId` attribute is always issued by the provisioning client and **MUST NOT** be
   * specified by the service provider. The service provider **MUST** always interpret the
   * `externalId` as scoped to the provisioning domain. While the server does not enforce
   * uniqueness, it is assumed that the value's uniqueness is controlled by the client setting the
   * value. See [Section 9](https://datatracker.ietf.org/doc/html/rfc7643#section-9) for additional
   * considerations regarding privacy. This attribute has `caseExact` as `true` and a mutability of
   * `readWrite`.
   */
  externalId?: string;

  /**
   * A complex attribute containing resource metadata. All `meta` sub-attributes are assigned by the
   * service provider (have a `mutability` of `readOnly`), and all of these sub-attributes have a
   * `returned` characteristic of `default`. This attribute **SHALL** be ignored when provided by
   * clients.
   */
  meta: ScimMeta;
}

/**
 * @see https://datatracker.ietf.org/doc/html/rfc7643#section-7
 */
export interface ScimSchemaAttribute {
  /**
   * The attribute’s name.
   */
  name: string;

  /**
   * The attribute’s data type. When an attribute is of type `complex`, there **SHOULD** be a
   * corresponding schema attribute `subAttributes` defined, listing the sub-attributes of the
   * attribute.
   */
  type: 'boolean' | 'complex' | 'dateTime' | 'decimal' | 'integer' | 'reference' | 'string';

  /**
   * When an attribute is of type `complex`, `subAttributes` defines a set of sub-attributes.
   * `subAttributes` has the same schema sub-attributes as `attributes`.
   */
  subAttributes?: ScimSchemaAttribute[];

  /**
   * A Boolean value indicating the attribute's plurality.
   */
  multiValued: boolean;

  /**
   * The attribute’s human-readable description. When applicable, service providers **MUST** specify
   * the description.
   */
  description: string;

  /**
   * A Boolean value that specifies whether or not the attribute is required.
   */
  required: boolean;

  /**
   * A collection of suggested canonical values that **MAY** be used (e.g., `work` and `home`). In
   * some cases, service providers **MAY** choose to ignore unsupported values.
   */
  canonicalValues?: string;

  /**
   * A Boolean value that specifies whether or not a string attribute is case sensitive. The server
   * **SHALL** use case sensitivity when evaluating filters. For attributes that are case exact, the
   * server **SHALL** preserve case for any value submitted. If the attribute is case insensitive,
   * the server **MAY** alter case for a submitted value. Case sensitivity also impacts how
   * attribute values **MAY** be compared against filter values see
   * [Section 3.4.2.2 of [RFC7644]](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.2)).
   */
  caseExact: boolean;

  /**
   * A single keyword indicating the circumstances under which the value of the attribute can be
   * (re)defined:
   *
   * - `readOnly`: The attribute **SHALL NOT** be modified.
   * - `readWrite`: The attribute **MAY** be updated and read at any time. This is the default
   * value.
   * - `immutable`: The attribute **MAY** be defined at resource creation (e.g., POST) or at record
   * replacement via a request (e.g., a PUT). The attribute **SHALL NOT** be updated.
   * - `writeOnly`: The attribute **MAY** be updated at any time. Attribute values **SHALL NOT** be
   * returned (e.g., because the value is a stored hash). Note: An attribute with a mutability of
   * `writeOnly` usually also has a returned setting of `never`.
   */
  mutability: 'immutable' | 'readOnly' | 'readWrite' | 'writeOnly';

  /**
   * A single keyword that indicates when an attribute and associated values are returned in
   * response to a GET request or in response to a PUT, POST, or PATCH request. Valid keywords
   * are as follows:
   *
   * - `always`: The attribute is always returned, regardless of the contents of the `attributes`
   * parameter.  For example, `id` is always returned to identify a SCIM resource.
   * - `never`: The attribute is never returned. This may occur because the original attribute value
   * (e.g., a hashed value) is not retained by the service provider.  A service provider **MAY**
   * allow attributes to be used in a search filter.
   * - `default`: The attribute is returned by default in all SCIM operation responses where
   * attribute values are returned. If the GET request `attributes` parameter is specified,
   * attribute values are only returned if the attribute is named in the `attributes` parameter.
   * - `request`: The attribute is returned in response to any PUT, POST, or PATCH operations if the
   * attribute was specified by the client (for example, the attribute was modified). The attribute
   * is returned in a SCIM query operation only if specified in the `attributes` parameter.
   *
   * @default 'default'
   */
  returned?: 'always' | 'default' | 'never' | 'request';

  /**
   * A single keyword value that specifies how the service provider enforces uniqueness of attribute
   * values. A server **MAY** reject an invalid value based on uniqueness by returning HTTP response
   * code 400 (Bad Request). A client **MAY** enforce uniqueness on the client side to a greater
   * degree than the service provider enforces. For example, a client could make a value unique
   * while the server has uniqueness of `none`. Valid keywords are as follows:
   *
   * - `none`: The values are not intended to be unique in any way.
   * - `server`: The value **SHOULD** be unique within the context of the current SCIM endpoint (or
   * tenancy) and **MAY** be globally unique (e.g., a "username", email address, or other
   * server-generated key or counter). No two resources on the same server **SHOULD** possess the
   * same value.
   * - `global`: The value **SHOULD** be globally unique (e.g., an email  address, a GUID, or other
   * value). No two resources on any server **SHOULD** possess the same value.
   *
   * @default 'none'
   */
  uniqueness?: 'global' | 'none' | 'server';

  /**
   * A multi-valued array of JSON strings that indicate the SCIM resource types that may be
   * referenced. Valid values are as follows:
   *
   * - A SCIM resource type (e.g., `User` or `Group`),
   * - `external` - indicating that the resource is an external resource (e.g., a photo), or
   * - `uri` - indicating that the reference is to a service endpoint or an identifier (e.g., a
   * schema URN).
   *
   * This attribute is only applicable for attributes that are of  type `reference`
   * ([Section 2.3.7](https://datatracker.ietf.org/doc/html/rfc7643#section-2.3.7)).
   */
  referenceTypes?: string[];
}

/**
 * This section defines a way to specify the schema in use by resources available and accepted by a
 * SCIM service provider. For each `schemas` URI value, this schema specifies the defined
 * attribute(s) and their characteristics (mutability, returnability, etc). For every schema URI
 * used in a resource object, there is a corresponding `Schema` resource. `Schema` resources are not
 * modifiable, and their associated attributes have a mutability of `readOnly`. Except for `id`
 * (which is always returned), all attributes have a `returned` characteristic of `default`. Unless
 * otherwise specified, all schema attributes are case insensitive. These resources have a `schemas`
 * attribute with the following schema URI:
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7643#section-7
 */
export interface ScimSchema extends ScimResource {
  /**
   * Unlike other core resources, the `Schema` resource **MAY** contain a complex object within a
   * sub-attribute, and all attributes are **REQUIRED** unless otherwise specified.
   */
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:Schema'];

  /**
   * The unique URI of the schema. When applicable, service providers **MUST** specify the URI,
   * e.g., `urn:ietf:params:scim:schemas:core:2.0:User`. Unlike most other schemas, which use some
   * sort of Globally Unique Identifier (GUID) for the `id`, the schema `id` is a URI so that it can
   * be registered and is portable between different service providers and clients.
   */
  id: string;

  /**
   * The schema’s human-readable name. When applicable, service providers **MUST** specify the name,
   * e.g., "User" or "Group".
   */
  name?: string;

  /**
   * The schema’s human-readable description. When applicable, service providers **MUST** specify
   * the description.
   */
  description?: string;

  /**
   * A complex type that defines service provider attributes and their qualities.
   */
  attributes: ScimSchemaAttribute[];
}

/**
 * SCIM provides a resource type for "User" resources.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7643#section-4.1
 */
export interface ScimUser extends ScimResource {
  schemas: [
    'urn:ietf:params:scim:schemas:core:2.0:User',
    'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User',
  ];

  /**
   * A service provider's unique identifier for the user, typically used by the user to directly
   * authenticate to the service provider. Often displayed to the user as their unique identifier
   * within the system (as opposed to `id` or `externalId`, which are generally opaque and not
   * user-friendly identifiers). Each User **MUST** include a non-empty userName value. This
   * identifier **MUST** be unique across the service provider’s entire set of Users. This attribute
   * is REQUIRED and is case insensitive.
   */
  userName: string;

  /**
   * The components of the user’s name. Service providers **MAY** return just the full name as a
   * single string in the formatted sub-attribute, or they **MAY** return just the individual
   * component attributes using the other sub-attributes, or they **MAY** return both. If both
   * variants are returned, they **SHOULD** be describing the same name, with the formatted name
   * indicating how the component attributes should be combined.
   */
  name?: {
    /**
     * The full name, including all middle names, titles, and suffixes as appropriate, formatted for
     * display.
     *
     * @example 'Ms. Barbara Jane Jensen, III'
     */
    formatted?: string;

    /**
     * The family name of the User, or last name in most Western languages.
     *
     * @example 'Jensen'
     */
    familyName?: string;

    /**
     * The given name of the User, or first name in most Western languages.
     *
     * @example 'Barbara'
     */
    givenName?: string;

    /**
     * The middle name(s) of the User.
     *
     * @example 'Jane'
     */
    middleName?: string;

    /**
     * The honorific prefix(es) of the User, or title in most Western languages.
     *
     * @example 'Ms.'
     */
    honorificPrefix?: string;

    /**
     * The honorific suffix(es) of the User, or suffix in most Western language.
     *
     * @example 'III'
     */
    honorificSuffix?: string;
  };

  /**
   *The name of the user, suitable for display to end-users. Each user returned **MAY** include a
   * non-empty displayName value. The name **SHOULD** be the full name of the User being described,
   * if known (e.g., "Babs Jensen" or "Ms. Barbara J Jensen, III") but **MAY** be a username or
   * handle, if that is all that is available (e.g., "bjensen"). The value provided **SHOULD** be
   * the primary textual label by which this User is normally displayed by the service provider when
   * presenting it to end-users.
   */
  displayName?: string;

  /**
   * The casual way to address the user in real life, e.g., "Bob" or "Bobby" instead of "Robert".
   * This attribute **SHOULD NOT** be used to represent a User's username (e.g., bjensen or
   * mpepperidge).
   */
  nickName?: string;

  /**
   * A URI that is a uniform resource locator (as defined in
   * [Section 1.1.3 of [RFC3986]](https://datatracker.ietf.org/doc/html/rfc3986#section-1.1.3)) and
   * that points to a location  representing the user’s online profile (e.g., a web page). URIs are
   * canonicalized per
   * [Section 6.2 of [RFC3986]](https://datatracker.ietf.org/doc/html/rfc3986#section-6.2).
   */
  profileUrl?: string;

  /**
   * The user’s title.
   *
   * @example 'Vice President'
   */
  title?: string;

  /**
   * Used to identify the relationship between the organization and the user. Typical values used
   * might be "Contractor", "Employee", "Intern", "Temp", "External", and "Unknown", but any value
   * may be used.
   */
  userType?: string;

  /**
   * Indicates the user’s preferred written or spoken languages and is generally used for selecting
   * a localized user interface. The value indicates the set of natural languages that are
   * preferred. The format of the value is the same as the HTTP Accept-Language header field (not
   * including `Accept-Language:`) and is specified in
   * [Section 5.3.5 of [RFC7231]](https://datatracker.ietf.org/doc/html/rfc7231#section-5.3.5). The
   * intent of this value is to enable cloud applications to perform matching of language tags
   * [[RFC4647](https://datatracker.ietf.org/doc/html/rfc4647)] to the user’s language preferences,
   * regardless of what may be indicated by a user agent (which might be shared), or in an
   * interaction that does not involve a user (such as in a delegated
   * OAuth 2.0 [[RFC6749](https://datatracker.ietf.org/doc/html/rfc6749)] style interaction) where
   * normal HTTP Accept-Language header negotiation cannot take place.
   */
  preferredLanguage?: string;

  /**
   * Used to indicate the User’s default location for purposes of localizing such items as currency,
   * date time format, or numerical representations. A valid value is a language tag as defined in
   * [[RFC5646](https://datatracker.ietf.org/doc/html/rfc5646)]. Computer languages are explicitly
   * excluded.
   *
   * A language tag is a sequence of one or more case-insensitive sub-tags, each separated by a
   * hyphen character (`-`, `%x2D`). For backward compatibility, servers **MAY** accept tags
   * separated by an underscore character (`_`, `%x5F`). In most cases, a language tag consists of
   * a primary language sub-tag that identifies a broad family of related languages (e.g.,
   * `en` = English) and that is optionally followed by a series of sub-tags that refine or narrow
   * that language’s range (e.g., `en-CA` = the variety of English as communicated in Canada).
   * Whitespace is not allowed within a language tag. Example tags include:
   *
   * - `fr`
   * - `en-US`
   * - `es-419`
   * - `az-Arab`
   * - `x-pig-latin`
   * - `man-Nkoo-GN`
   *
   * See [[RFC5646](https://datatracker.ietf.org/doc/html/rfc5646)] for further information.
   */
  locale?: string;

  /**
   * The User’s time zone, in IANA Time Zone database format
   * [[RFC6557](https://datatracker.ietf.org/doc/html/rfc6557)], also known as the “Olson” time zone
   * database format [[Olson-TZ](https://datatracker.ietf.org/doc/html/rfc7643#ref-Olson-TZ)]
   *
   * @example 'America/Los_Angeles'
   */
  timezone?: string;

  /**
   * A Boolean value indicating the user’s administrative status. The definitive meaning of this
   * attribute is determined by the service provider. As a typical example, a value of true implies
   * that the user is able to log in, while a value of false implies that the user’s account has
   * been suspended.
   */
  active?: boolean;

  /**
   * This attribute is intended to be used as a means to set, replace, or compare (i.e., filter for
   * equality) a password. The cleartext value or the hashed value of a password **SHALL NOT** be
   * returnable by a service provider. If a service provider holds the value locally, the value
   * **SHOULD** be hashed. When a password is set or changed by the client, the cleartext password
   * **SHOULD** be processed by the service provider as follows:
   *
   * - Prepare the cleartext value for international language
   * comparison. See
   * [Section 7.8 of [RFC7644]](https://datatracker.ietf.org/doc/html/rfc7644#section-7.8).
   * - Validate the value against server password policy. Note: The definition and enforcement of
   * password policy are beyond the scope of this document.
   * - Ensure that the value is encrypted (e.g., hashed). See
   * [Section 9.2](https://datatracker.ietf.org/doc/html/rfc7643#section-9.2) for acceptable hashing
   * and encryption handling when storing or persisting for provisioning workflow reasons.
   *
   * A service provider that immediately passes the cleartext value on to another system or
   * programming interface **MUST** pass the value directly over a secured connection (e.g.,
   * Transport Layer Security (TLS)). If the value needs to be temporarily persisted for a period of
   * time (e.g., because of a workflow) before provisioning, then the value **MUST** be protected by
   * some method, such as encryption.
   *
   * Testing for an equality match **MAY** be supported if there is an existing stored hashed value.
   * When testing for equality, the service provider:
   *
   * - Prepares the filter value for international language comparison. See
   * [Section 7.8 of [RFC7644]](https://datatracker.ietf.org/doc/html/rfc7644#section-7.8).
   * - Generates the salted hash of the filter value and tests for a match with the locally held
   * value.
   *
   * The mutability of the password attribute is `writeOnly`, indicating that the value **MUST NOT**
   * be returned by a service provider in any form (the attribute characteristic `returned` is
   * `never`).
   */
  password?: string;

  /**
   * Email addresses for the User.
   */
  emails?: {
    /**
     * The value **SHOULD** be specified according to
     * [[RFC5321](https://datatracker.ietf.org/doc/html/rfc5321)]. Service providers **SHOULD**
     * canonicalize the value according to
     * [[RFC5321](https://datatracker.ietf.org/doc/html/rfc5321)], e.g., `bjensen@example.com`
     * instead of `bjensen@EXAMPLE.COM`.
     */
    value: string;

    /**
     * The `display` sub-attribute **MAY** be used to return the canonicalized representation of the
     * email value.
     */
    display?: string;

    /**
     * The `type` sub-attribute is used to provide a classification meaningful to the (human) user.
     * The user interface should encourage the use of basic values of `work`, `home`, and `other`
     * and **MAY** allow additional type values to be used at the discretion of SCIM clients.
     */
    type: string;

    primary?: boolean;
  }[];

  'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User': {
    manager: string | { value: string };
  };

  // XXX There are more fields
}

/**
 * SCIM provides a schema for representing groups, identified using the
 * following schema URI: "urn:ietf:params:scim:schemas:core:2.0:Group".
 *
 * "Group" resources are meant to enable expression of common
 * group-based or role-based access control models, although no explicit
 * authorization model is defined.  It is intended that the semantics of
 * group membership, and any behavior or authorization granted as a
 * result of membership, are defined by the service provider; these are
 * considered out of scope for this specification.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7643#section-4.2
 */
export interface ScimGroup extends ScimResource {
  schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'];

  /**
   * A human-readable name for the Group.
   */
  displayName: string;

  /**
   * A list of members of the Group.  While values MAY be added or
   * removed, sub-attributes of members are "immutable".  The "value"
   * sub-attribute contains the value of an "id" attribute of a SCIM
   * resource, and the "$ref" sub-attribute must be the URI of a SCIM
   * resource such as a "User", or a "Group".  The intention of the
   * "Group" type is to allow the service provider to support nested
   * groups.  Service providers MAY require clients to provide a
   * non-empty value by setting the "required" attribute characteristic
   * of a sub-attribute of the "members" attribute in the "Group"
   * resource schema.
   */
  members?: {
    value: string;
    display?: string;
  }[];
}

/**
 * The SCIM protocol defines a standard set of query parameters that can be used to filter, sort,
 * and paginate to return zero or more resources in a query response. Queries **MAY** be made
 * against a single resource or a resource type endpoint (e.g., `/Users`), or the service provider
 * Base URI. SCIM service providers **MAY** support additional query parameters not specified here
 * and **SHOULD** ignore any query parameters they do not recognize instead of rejecting the query
 * for versioning compatibility reasons.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2
 */
export interface ScimListResponse<T> {
  schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'];

  /**
   * The total number of results returned by the list or query operation. The value may be larger
   * than the number of resources returned, such as when returning a single page (see
   * [Section 3.4.2.4](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.4)) of results
   * where multiple pages are available.
   */
  totalResults: number;

  /**
   * A multi-valued list of complex objects containing the requested resources. This **MAY** be a
   * subset of the full set of resources if pagination
   * ([Section 3.4.2.4](https://datatracker.ietf.org/doc/html/rfc7644#section-3.4.2.4)) is
   * requested. REQUIRED if `totalResults` is non-zero.
   */
  Resources?: T[];

  /**
   * The 1-based index of the first result in the current set of list results. REQUIRED when partial
   * results are returned due to pagination.
   */
  startIndex?: number;

  /**
   * The number of resources returned in a list response page. REQUIRED when partial results are
   * returned due to pagination.
   *
   */
  itemsPerPage?: number;
}
