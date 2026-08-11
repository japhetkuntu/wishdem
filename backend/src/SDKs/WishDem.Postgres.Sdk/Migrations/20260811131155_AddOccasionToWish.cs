using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WishDem.Postgres.Sdk.Migrations
{
    /// <inheritdoc />
    public partial class AddOccasionToWish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "RecipientBirthday",
                schema: "core",
                table: "wishes",
                newName: "RecipientOccasionDate");

            // Backfilled to "Birthday" rather than an empty string: every wish created
            // before this migration was a birthday wish (it's all the product supported),
            // and an empty string isn't a valid OccasionType name — reading one back would
            // throw instead of just... being a birthday wish, like it always was.
            migrationBuilder.AddColumn<string>(
                name: "Occasion",
                schema: "core",
                table: "wishes",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "Birthday");

            migrationBuilder.AddColumn<string>(
                name: "OccasionLabel",
                schema: "core",
                table: "wishes",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Occasion",
                schema: "core",
                table: "wishes");

            migrationBuilder.DropColumn(
                name: "OccasionLabel",
                schema: "core",
                table: "wishes");

            migrationBuilder.RenameColumn(
                name: "RecipientOccasionDate",
                schema: "core",
                table: "wishes",
                newName: "RecipientBirthday");
        }
    }
}
