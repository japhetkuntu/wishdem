using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddCircleMoneyModerationGroupWishes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "circle_people",
                schema: "core",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RelationshipLabel = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Group = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Birthday = table.Column<DateOnly>(type: "date", nullable: true),
                    Timezone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Note = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_circle_people", x => x.Id);
                    table.ForeignKey(
                        name: "FK_circle_people_customer_users_CustomerUserId",
                        column: x => x.CustomerUserId,
                        principalSchema: "identity",
                        principalTable: "customer_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_wishes",
                schema: "core",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizerCustomerUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    RecipientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Occasion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DeliveryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CollectByDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Context = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OrganizerNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Formats = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    NamesVisible = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    SealedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_wishes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_group_wishes_customer_users_OrganizerCustomerUserId",
                        column: x => x.OrganizerCustomerUserId,
                        principalSchema: "identity",
                        principalTable: "customer_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "moderation_cases",
                schema: "core",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WishId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    EvidenceQuote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ContentType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    Severity = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ReviewerAdminUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Decision = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    DecisionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    DecidedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_moderation_cases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_moderation_cases_admin_users_ReviewerAdminUserId",
                        column: x => x.ReviewerAdminUserId,
                        principalSchema: "identity",
                        principalTable: "admin_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_moderation_cases_wishes_WishId",
                        column: x => x.WishId,
                        principalSchema: "core",
                        principalTable: "wishes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "payments",
                schema: "core",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WishId = table.Column<Guid>(type: "uuid", nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Provider = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProviderReference = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                    FailureReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SettledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RefundAmount = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    RefundReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    RefundedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_payments_wishes_WishId",
                        column: x => x.WishId,
                        principalSchema: "core",
                        principalTable: "wishes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_wish_invitations",
                schema: "core",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupWishId = table.Column<Guid>(type: "uuid", nullable: false),
                    InviteToken = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    GuestName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    GuestEmail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    RespondedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_wish_invitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_group_wish_invitations_group_wishes_GroupWishId",
                        column: x => x.GroupWishId,
                        principalSchema: "core",
                        principalTable: "group_wishes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_wish_memories",
                schema: "core",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupWishId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Format = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Body = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    WhenWhere = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AttachmentUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AttachmentDurationSeconds = table.Column<int>(type: "integer", nullable: true),
                    IsSealed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_group_wish_memories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_group_wish_memories_group_wish_invitations_InvitationId",
                        column: x => x.InvitationId,
                        principalSchema: "core",
                        principalTable: "group_wish_invitations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_group_wish_memories_group_wishes_GroupWishId",
                        column: x => x.GroupWishId,
                        principalSchema: "core",
                        principalTable: "group_wishes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_circle_people_CustomerUserId",
                schema: "core",
                table: "circle_people",
                column: "CustomerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_group_wish_invitations_GroupWishId",
                schema: "core",
                table: "group_wish_invitations",
                column: "GroupWishId");

            migrationBuilder.CreateIndex(
                name: "IX_group_wish_invitations_InviteToken",
                schema: "core",
                table: "group_wish_invitations",
                column: "InviteToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_group_wish_memories_GroupWishId",
                schema: "core",
                table: "group_wish_memories",
                column: "GroupWishId");

            migrationBuilder.CreateIndex(
                name: "IX_group_wish_memories_InvitationId",
                schema: "core",
                table: "group_wish_memories",
                column: "InvitationId");

            migrationBuilder.CreateIndex(
                name: "IX_group_wishes_OrganizerCustomerUserId",
                schema: "core",
                table: "group_wishes",
                column: "OrganizerCustomerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_moderation_cases_ReviewerAdminUserId",
                schema: "core",
                table: "moderation_cases",
                column: "ReviewerAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_moderation_cases_Status",
                schema: "core",
                table: "moderation_cases",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_moderation_cases_WishId",
                schema: "core",
                table: "moderation_cases",
                column: "WishId");

            migrationBuilder.CreateIndex(
                name: "IX_payments_Status",
                schema: "core",
                table: "payments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_payments_WishId",
                schema: "core",
                table: "payments",
                column: "WishId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "circle_people",
                schema: "core");

            migrationBuilder.DropTable(
                name: "group_wish_memories",
                schema: "core");

            migrationBuilder.DropTable(
                name: "moderation_cases",
                schema: "core");

            migrationBuilder.DropTable(
                name: "payments",
                schema: "core");

            migrationBuilder.DropTable(
                name: "group_wish_invitations",
                schema: "core");

            migrationBuilder.DropTable(
                name: "group_wishes",
                schema: "core");
        }
    }
}
