CREATE TABLE IF NOT EXISTS complaints (
  id                      SERIAL PRIMARY KEY,
  complaint_number        VARCHAR(30) UNIQUE NOT NULL,
  office_id               INTEGER REFERENCES offices(id),
  complainant_name        VARCHAR(150) NOT NULL,
  complainant_contact     VARCHAR(80),
  article_number          VARCHAR(50),
  article_type            VARCHAR(40) NOT NULL
                          CHECK (article_type IN (
                            'Registered Letter', 'Speed Post', 'Money Order',
                            'Urgent Money Order', 'Parcel', 'Insured Parcel',
                            'Value Payable Letter', 'Value Payable Parcel',
                            'Cash on Delivery', 'Ordinary'
                          )),
  date_received           DATE NOT NULL,
  source                  VARCHAR(20) NOT NULL CHECK (source IN ('WhatsApp', 'Post Letter', 'In Person')),
  complaint_description   TEXT NOT NULL,
  status                  VARCHAR(30) NOT NULL DEFAULT 'Active'
                          CHECK (status IN (
                            'Active', 'Proof Shared', 'Memo Generated',
                            'Memo Sent to DSPS', 'Reply Received', 'Closed'
                          )),
  proof_of_delivery_notes TEXT,
  proof_shared_date       DATE,
  memo_subject_code       VARCHAR(50),
  memo_generated_date     DATE,
  memo_sent_to_dsps_date  DATE,
  dsps_reply_received     BOOLEAN NOT NULL DEFAULT false,
  dsps_reply_date         DATE,
  dsps_reply_notes        TEXT,
  resolution_notes        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
