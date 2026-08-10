using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationCaseAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssignedAdminUserId",
                schema: "core",
                table: "moderation_cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_moderation_cases_AssignedAdminUserId",
                schema: "core",
                table: "moderation_cases",
                column: "AssignedAdminUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_moderation_cases_admin_users_AssignedAdminUserId",
                schema: "core",
                table: "moderation_cases",
                column: "AssignedAdminUserId",
                principalSchema: "identity",
                principalTable: "admin_users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_moderation_cases_admin_users_AssignedAdminUserId",
                schema: "core",
                table: "moderation_cases");

            migrationBuilder.DropIndex(
                name: "IX_moderation_cases_AssignedAdminUserId",
                schema: "core",
                table: "moderation_cases");

            migrationBuilder.DropColumn(
                name: "AssignedAdminUserId",
                schema: "core",
                table: "moderation_cases");
        }
    }
}
