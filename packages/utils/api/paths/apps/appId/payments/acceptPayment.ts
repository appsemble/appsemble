import { type OpenAPIV3 } from 'openapi-types';

export const pathItems: OpenAPIV3.PathItemObject = {
  post: {
    tags: ['main', 'app', 'payments'],
    description: 'Accept a payment for in app transaction.',
    operationId: 'acceptAppPayment',
    requestBody: {
      description: 'Information about the payment sent by Stripe forwarded to an app webhook.',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              object: {
                type: 'string',
              },
              api_version: {
                type: 'string',
              },
              created: {
                type: 'number',
              },
              data: {
                type: 'object',
                properties: {
                  object: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                      },
                      object: {
                        type: 'string',
                      },
                      account_country: {
                        type: 'string',
                      },
                      account_name: {
                        type: 'string',
                      },
                      account_tax_ids: {
                        type: 'string',
                      },
                      amount_due: {
                        type: 'number',
                      },
                      amount_paid: {
                        type: 'number',
                      },
                      amount_remaining: {
                        type: 'number',
                      },
                      amount_shipping: {
                        type: 'number',
                      },
                      application: {
                        type: 'string',
                      },
                      application_fee_amount: {
                        type: 'number',
                      },
                      attempt_count: {
                        type: 'number',
                      },
                      attempted: {
                        type: 'boolean',
                      },
                      auto_advance: {
                        type: 'boolean',
                      },
                      automatic_tax: {
                        type: 'object',
                      },
                      automatically_finalizes_at: {
                        type: 'number',
                      },
                      billing_reason: {
                        type: 'string',
                      },
                      charge: {
                        type: 'string',
                      },
                      collection_method: {
                        type: 'string',
                      },
                      created: {
                        type: 'number',
                      },
                      currency: {
                        type: 'string',
                      },
                      custom_fields: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      customer: {
                        type: 'string',
                      },
                      customer_address: {
                        type: 'object',
                      },
                      customer_email: {
                        type: 'string',
                      },
                      customer_name: {
                        type: 'string',
                      },
                      customer_phone: {
                        type: 'string',
                      },
                      customer_shipping: {
                        type: 'object',
                      },
                      customer_tax_exempt: {
                        type: 'string',
                      },
                      customer_tax_ids: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      default_payment_method: {
                        type: 'string',
                      },
                      default_source: {
                        type: 'string',
                      },
                      default_tax_rates: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      description: {
                        type: 'string',
                      },
                      discount: {
                        type: 'object',
                      },
                      discounts: {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                      due_date: {
                        type: 'number',
                      },
                      effective_at: {
                        type: 'number',
                      },
                      ending_balance: {
                        type: 'number',
                      },
                      footer: {
                        type: 'string',
                      },
                      from_invoice: {
                        type: 'object',
                      },
                      hosted_invoice_url: {
                        type: 'string',
                      },
                      invoice_pdf: {
                        type: 'string',
                      },
                      issuer: {
                        type: 'object',
                      },
                      last_finalization_error: {
                        type: 'object',
                      },
                      latest_revision: {
                        type: 'string',
                      },
                      lines: {
                        type: 'object',
                      },
                      livemode: {
                        type: 'boolean',
                      },
                      metadata: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'number',
                          },
                        },
                      },
                      next_payment_attempt: {
                        type: 'number',
                      },
                      number: {
                        type: 'string',
                      },
                      on_behalf_of: {
                        type: 'string',
                      },
                      paid: {
                        type: 'boolean',
                      },
                      paid_out_of_band: {
                        type: 'boolean',
                      },
                      payment_intent: {
                        type: 'string',
                      },
                      payment_settings: {
                        type: 'object',
                      },
                      period_end: {
                        type: 'number',
                      },
                      period_start: {
                        type: 'number',
                      },
                      post_payment_credit_notes_amount: {
                        type: 'number',
                      },
                      pre_payment_credit_notes_amount: {
                        type: 'number',
                      },
                      quote: {
                        type: 'string',
                      },
                      receipt_number: {
                        type: 'string',
                      },
                      rendering: {
                        type: 'object',
                      },
                      shipping_cost: {
                        type: 'object',
                      },
                      shipping_details: {
                        type: 'object',
                      },
                      starting_balance: {
                        type: 'number',
                      },
                      statement_descriptor: {
                        type: 'string',
                      },
                      status: {
                        type: 'string',
                      },
                      status_transitions: {
                        type: 'object',
                      },
                      subscription: {
                        type: 'string',
                      },
                      subscription_details: {
                        type: 'object',
                      },
                      subtotal: {
                        type: 'number',
                      },
                      subtotal_excluding_tax: {
                        type: 'number',
                      },
                      tax: {
                        type: 'number',
                      },
                      test_clock: {
                        type: 'string',
                      },
                      total: {
                        type: 'number',
                      },
                      total_discount_amounts: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      total_excluding_tax: {
                        type: 'number',
                      },
                      total_pretax_credit_amounts: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      total_tax_amounts: {
                        type: 'array',
                        items: {
                          type: 'object',
                        },
                      },
                      transfer_data: {
                        type: 'object',
                      },
                      webhooks_delivered_at: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
              livemode: {
                type: 'boolean',
              },
              pending_webhooks: {
                type: 'number',
              },
              request: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                  },
                  idempotency_key: {
                    type: 'string',
                  },
                },
              },
              type: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description:
          'Response sent to Stripe, should be 200 OK if we receive the webhook, regardless of our internals.',
      },
    },
  },
};
