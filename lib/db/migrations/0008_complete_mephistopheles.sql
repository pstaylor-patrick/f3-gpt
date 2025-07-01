CREATE TABLE IF NOT EXISTS "f3"."SlackMessage" (
	"sk" varchar(255) PRIMARY KEY NOT NULL,
	"channelId" varchar(255) NOT NULL,
	"channelName" varchar(255) NOT NULL,
	"messageId" varchar(255) NOT NULL,
	"messageText" text NOT NULL,
	"messageAuthor" varchar(255) NOT NULL,
	"ingestedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "f3"."SlackUser" (
	"userId" varchar(255) PRIMARY KEY NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"ingestedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "f3"."SlackMessage" ADD CONSTRAINT "SlackMessage_messageAuthor_SlackUser_userId_fk" FOREIGN KEY ("messageAuthor") REFERENCES "f3"."SlackUser"("userId") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
