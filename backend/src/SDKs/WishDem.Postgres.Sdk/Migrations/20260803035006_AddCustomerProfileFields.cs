using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarUrl",
                schema: "identity",
                table: "customer_users",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                schema: "identity",
                table: "customer_users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DateOfBirth",
                schema: "identity",
                table: "customer_users",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Region",
                schema: "identity",
                table: "customer_users",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarUrl",
                schema: "identity",
                table: "customer_users");

            migrationBuilder.DropColumn(
                name: "Country",
                schema: "identity",
                table: "customer_users");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                schema: "identity",
                table: "customer_users");

            migrationBuilder.DropColumn(
                name: "Region",
                schema: "identity",
                table: "customer_users");
        }
    }
}
