export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {
        const player = this.registry.get("playerPokemon");
        const ai = this.registry.get("aiPokemon");

        // Fond
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x1e1e1e).setOrigin(0);

        const centerY = this.scale.height / 2;

        // UI Cards
        this.playerUI = this.createHorizontalCard(
            player,
            this.scale.width * 0.25,
            centerY,
            true
        );

        this.aiUI = this.createHorizontalCard(
            ai,
            this.scale.width * 0.75,
            centerY,
            false
        );

        /* =======================
           BOUTON D'ATTAQUE
        ======================= */
        this.createAttackButton();

        // Sauvegarde des HP
        this.playerHP = player.hp;
        this.aiHP = ai.hp;

        // Attaque du joueur → IA
        this.attackButton.on("pointerdown", () => {
            this.handlePlayerAttack();
        });
    }

    /* ============================================================
        BOUTON D'ATTAQUE
    ============================================================ */
    createAttackButton() {
        this.attackButton = this.add.text(
            this.scale.width / 2,
            this.scale.height - 80,
            "ATTACK",
            {
                font: "32px Arial",
                fill: "#fff",
                backgroundColor: "#444",
                padding: { x: 20, y: 10 }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Hover
        this.attackButton.on("pointerover", () => {
            this.attackButton.setStyle({ backgroundColor: "#666" });
        });

        this.attackButton.on("pointerout", () => {
            this.attackButton.setStyle({ backgroundColor: "#444" });
        });
    }

    /* ============================================================
        GESTION ATTAQUE DU JOUEUR
    ============================================================ */
    handlePlayerAttack() {
        const damage = 30; // test : dégâts fixes

        this.aiHP = Math.max(0, this.aiHP - damage);

        // Animation
        this.animateHP(this.aiUI.hpBar, this.aiUI.hpText, this.aiHP, this.registry.get("aiPokemon").hp);
    }

    /* ============================================================
        ANIMATION HP DIMINUANT
    ============================================================ */
    animateHP(hpBar, hpText, newHP, maxHP) {
        const percent = newHP / maxHP;
        const newWidth = 210 * percent;

        // Tween largeur de la barre rouge
        this.tweens.add({
            targets: hpBar,
            displayWidth: newWidth,
            duration: 600,
            ease: "Cubic.easeOut"
        });

        // Met à jour le texte
        hpText.setText(`${newHP} / ${maxHP} HP`);
    }

    /* ============================================================
        UI CARD (mise à jour incluse)
    ============================================================ */
    createHorizontalCard(pokemon, x, y, isPlayer = false) {

        // Étiquette (Player/AI)
        this.add.text(x, y - 210, isPlayer ? "PLAYER" : "AI", {
            font: "24px Arial",
            fill: "#fff",
            fontStyle: "bold"
        }).setOrigin(0.5);

        // Cadre
        this.add.rectangle(x, y, 260, 340, isPlayer ? 0x203040 : 0x402030, 0.85)
            .setStrokeStyle(4, 0xffffff)
            .setOrigin(0.5);

        // Image
        this.add.image(x, y - 10, pokemon.id)
            .setDisplaySize(170, 240);

        /* ---- HP UI ---- */
        const hpMax = pokemon.hp;
        const hp = pokemon.hp;

        // Fond barre HP
        this.add.rectangle(x, y + 140, 210, 26, 0x000000, 0.6)
            .setOrigin(0.5);

        // Barre rouge (HP)
        const hpBar = this.add.rectangle(x - 105, y + 140, 210, 26, 0xff5555)
            .setOrigin(0, 0.5);

        // Texte HP
        const hpText = this.add.text(x, y + 140, `${hp} / ${hpMax} HP`, {
            font: "18px Arial",
            fill: "#fff"
        }).setOrigin(0.5);

        return { hpBar, hpText };
    }
}
